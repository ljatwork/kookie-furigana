import { toKanjiToken } from "./kanji-tokenizer";
import { type KanjiToken } from "./token-types";
import mojiTokenhandler from "./moji-token";

export const FURIGANA_CLASS = "furigana";

export const tokenize = async (text: string): Promise<KanjiToken[]> => {
  const response = await mojiTokenhandler(text);
  return toKanjiToken(response);
};

const createRuby = (original: string, reading: string): HTMLElement => {
  const ruby = document.createElement("ruby");
  ruby.classList.add(FURIGANA_CLASS);
  const rightParenthesisRp = document.createElement("rp");
  rightParenthesisRp.textContent = ")";
  const leftParenthesisRp = document.createElement("rp");
  leftParenthesisRp.textContent = "(";
  const originalText = document.createTextNode(original);

  const readingTextNode = document.createTextNode(reading);
  const rt = document.createElement("rt");
  rt.appendChild(readingTextNode);
  ruby.appendChild(originalText);
  ruby.appendChild(leftParenthesisRp);
  ruby.appendChild(rt);
  ruby.appendChild(rightParenthesisRp);
  return ruby;
};

export const addFurigana = async (text: string) => {
  let htmlText: string = text;
  await tokenize(text).then((tokens: KanjiToken[]) => {
    for (const token of tokens.reverse()) {
      const ruby = createRuby(token.original, token.reading);
      htmlText = replaceRange(htmlText, token.start, token.end, ruby.outerHTML);
    }
  });

  return htmlText;
};

const replaceRange = (
  s: string,
  start: number,
  end: number,
  substitute: string
) => {
  return s.substring(0, start) + substitute + s.substring(end);
};
