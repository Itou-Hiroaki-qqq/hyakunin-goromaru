/**
 * 復習リスト（テストで間違えた問題）の localStorage 管理
 */

export type ReviewItem =
  | { id: string; type: "range"; poemId: number; range: string }
  | { id: string; type: "all"; poemId: number }
  | {
      id: string;
      type: "kami_tricky";
      poemId: number;
      choicePoemIds: number[];
    }
  | {
      id: string;
      type: "shimo_tricky";
      poemId: number;
      choicePoemIds: number[];
    };

const STORAGE_KEY = "hyakunin_review_list";

function getStored(): ReviewItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ReviewItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setStored(items: ReviewItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

/** 同一問題のキー（重複追加防止用） */
function itemKey(item: Omit<ReviewItem, "id">): string {
  switch (item.type) {
    case "range":
      return `range:${item.poemId}:${(item as unknown as { range: string }).range}`;
    case "all":
      return `all:${item.poemId}`;
    default: {
      const t = item as unknown as { type: string; poemId: number; choicePoemIds: number[] };
      return `${t.type}:${t.poemId}:${t.choicePoemIds.join(",")}`;
    }
  }
}

export function getReviewList(): ReviewItem[] {
  return getStored();
}

export function addToReviewList(
  item: Omit<ReviewItem, "id">
): void {
  const list = getStored();
  const key = itemKey(item);
  if (list.some((x) => itemKey(x as Omit<ReviewItem, "id">) === key)) return;
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `rev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  list.push({ ...item, id } as ReviewItem);
  setStored(list);
}

export function removeFromReviewList(id: string): void {
  const list = getStored().filter((x) => x.id !== id);
  setStored(list);
}
