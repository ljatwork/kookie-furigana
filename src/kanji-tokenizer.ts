import { isKanji, toHiragana } from "wanakana";
import { MojiToken, KanjiToken } from "./token-types";

/**
 * Extract useful kanji phonetic information from KuromojiToken[].
 * @example
 * ```
 * Input: tokenizer('「我々」と「関ケ原」')
 * Output:
 * [
 *  { original: '我々', reading: 'ワレワレ', start: 1, end: 3 },
 *  { original: '関ケ原', reading: 'セキガハラ', start: 6, end: 9 }
 * ]
 * ```
 */
export const toKanjiToken = (tokens: MojiToken[]): KanjiToken[] => {
  return tokens.filter(isPhonetic).map(toSimplifiedToken).flatMap(toRubyText);
};

const isPhonetic = (token: MojiToken): boolean => {
  const hasKanji = token.surface_form.match(/\p{sc=Han}/u);
  const isPhonetic = !!(token.reading && token.reading !== "*" && hasKanji);
  return isPhonetic;
};

interface SimplifiedToken {
  original: string;
  reading: string; // Convert Katakana to Hiragana
  start: number; // Indexes start from 0
  end: number;
}

const toSimplifiedToken = (kuromojiToken: MojiToken): SimplifiedToken => {
  const toSimplifiedToken = {
    original: kuromojiToken.surface_form,
    reading: toHiragana(kuromojiToken.reading)!,
    start: kuromojiToken.word_position - 1,
    end: kuromojiToken.word_position - 1 + kuromojiToken.surface_form.length,
  };
  return toSimplifiedToken;
};

const toRubyText = (token: SimplifiedToken): KanjiToken | KanjiToken[] => {
  // The pure Kanji words do not need to be disassembled.
  if (isKanji(token.original)) {
    return {
      original: token.original,
      reading: token.reading,
      start: token.start,
      end: token.end,
    };
  }
  return smashToken(token);
};
interface MarkToken {
  original: string;
  start: number;
  end: number;
}

type MarkTokenArray = MarkToken[] & { hybridLength: number };

// Must be a mixture of Kanji and Kana to use this function.
const smashToken = (token: SimplifiedToken): KanjiToken[] => {
  const { original, reading, start, end } = token;
  // Both \p{sc=Hira} and \p{sc=Kana} don’t contain 'ー々', which is bad.
  const kanaRegex = /(\p{sc=Hira}|\p{sc=Kana}|ー)+/gu;
  const kanas: MarkTokenArray = [...original.matchAll(kanaRegex)].map(
    (match) => ({
      original: toHiragana(match[0]),
      start: match.index!,
      end: match.index! + match[0].length,
    })
  ) as MarkTokenArray;
  kanas.hybridLength = original.length;

  const hybridRegex = buildRegex(kanas);

  const kanjisRegex = /\p{sc=Han}+/gu;
  const kanjis: KanjiToken[] = [...original.matchAll(kanjisRegex)].map(
    (match) => ({
      original: match[0],
      start: start + match.index!,
      end: start + match.index! + match[0].length,
    })
  ) as KanjiToken[];
  // The first matching group is the entire string.
  // All that's needed is the sub-capturing group.
  const hybridMatch = reading.match(hybridRegex)?.slice(1);
  // If the number of matching groups is not equal to the number of Kanji,
  // it means that the phonetic notation does not correspond to the text.
  // E.g. "関ケ原"(セキガハラ)/"我々"(ワレワレ)
  if (!hybridMatch || hybridMatch.length !== kanjis.length) {
    return [{ original, reading, start, end }];
  }

  kanjis.forEach((kanji, index) => {
    kanji.reading = hybridMatch[index]!;
  });

  return kanjis;
};

// Cases where phonetic notation does not correspond to text create an invalid regular expression.
const buildRegex = (kanas: MarkTokenArray): RegExp => {
  // Match empty string, actual sub-capturing group is 0.
  if (!kanas.length) {
    return new RegExp("^$", "u");
  }
  // "作り方" => "^(.+)リ(.+)$", "り方" => "^リ(.+)$", "作り" => "^(.+)リ$".
  const firstKana = kanas.at(0)!;
  const lastKana = kanas.at(-1)!;
  let regex = "^";
  const placeholder = "(.+)";
  if (firstKana.start) {
    regex += placeholder;
  }
  for (const kana of kanas) {
    regex += kana.original;
    if (kana !== lastKana) {
      regex += placeholder;
    }
  }
  if (lastKana.end !== kanas.hybridLength) {
    regex += placeholder;
  }
  regex += "$";
  return new RegExp(regex, "u");
};
