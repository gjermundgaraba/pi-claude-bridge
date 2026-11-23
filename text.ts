import { stripVTControlCharacters } from "node:util";

const UNSAFE_DISPLAY_CHARACTERS =
  /[[\p{Cc}--[\t\n]]\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/gv;

/** Remove terminal controls and bidi overrides, preserving log newlines and tabs. */
export const safeText = (text: string): string =>
  stripVTControlCharacters(text).replaceAll(UNSAFE_DISPLAY_CHARACTERS, "");
