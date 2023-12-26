export type MojiToken = {
  word_position: number; // Indexes start from 1
  surface_form: string;
  reading?: string | undefined; // Katakana only
};

// It's not just kanji, such as "市ヶ谷" (イチガヤ), "我々" (ワレワレ).
export type KanjiToken = {
  original: string;
  reading: string;
  start: number; // Indexes start from 0
  end: number;
};
