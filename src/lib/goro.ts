/**
 * 語呂文字列から「ひらがな部分」を抽出（～などを除く）
 */
export function goroToSearch(goro: string): string {
  return goro.replace(/～/g, "").trim();
}

/**
 * 検索用に正規化（歴史的仮名・表記ゆれを吸収）
 * が↔か、べ↔へ など、ひらがなテキストと語呂で表記が違う場合に一致させる
 */
function normalizeForMatch(s: string): string {
  return s
    .replace(/が/g, "か")
    .replace(/べ/g, "へ")
    .replace(/ゐ/g, "い")
    .replace(/ゑ/g, "え");
}

/**
 * ひらがなテキスト内で語呂に相当する部分の開始位置と長さを返す
 * 語呂が部分一致しない場合は正規化して検索（が→か、べ→へ 等）
 */
export function findGoroRange(hiragana: string, goro: string): { start: number; length: number } {
  const search = goroToSearch(goro);
  if (!search || !hiragana) return { start: 0, length: 0 };

  let idx = hiragana.indexOf(search);
  if (idx >= 0) return { start: idx, length: search.length };

  const normHiragana = normalizeForMatch(hiragana);
  const normSearch = normalizeForMatch(search);
  idx = normHiragana.indexOf(normSearch);
  if (idx >= 0) return { start: idx, length: normSearch.length };

  if (hiragana.length > 0) return { start: 0, length: 1 };
  return { start: 0, length: 0 };
}
