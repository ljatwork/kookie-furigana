import { getTokenizer } from "kuromojin";

import { MojiToken } from "./token-types";
const mojiTokenhandler = async (text: string) => {
  const tokenizer = await getTokenizer({
    dicPath: "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict",
  });
  const message: MojiToken[] = tokenizer.tokenize(text);
  return message;
};

export default mojiTokenhandler;
