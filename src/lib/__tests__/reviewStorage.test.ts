import {
  getReviewList,
  addToReviewList,
  removeFromReviewList,
  type ReviewItem,
} from "@/lib/reviewStorage";

const STORAGE_KEY = "hyakunin_review_list";

beforeEach(() => {
  localStorage.clear();
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    jest.spyOn(crypto, "randomUUID").mockReturnValue("test-uuid-123");
  }
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("getReviewList", () => {
  it("初期状態では空配列", () => {
    expect(getReviewList()).toEqual([]);
  });

  it("localStorage に保存済みならパースして返す", () => {
    const items: ReviewItem[] = [
      { id: "a", type: "range", poemId: 1, range: "1-4" },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    expect(getReviewList()).toEqual(items);
  });
});

describe("addToReviewList", () => {
  it("1件追加できる", () => {
    addToReviewList({ type: "range", poemId: 1, range: "1-4" });
    const list = getReviewList();
    expect(list).toHaveLength(1);
    expect(list[0].type).toBe("range");
    expect(list[0].poemId).toBe(1);
    expect((list[0] as { range: string }).range).toBe("1-4");
    expect(list[0].id).toBeDefined();
  });

  it("同一問題は重複追加しない", () => {
    addToReviewList({ type: "range", poemId: 1, range: "1-4" });
    addToReviewList({ type: "range", poemId: 1, range: "1-4" });
    expect(getReviewList()).toHaveLength(1);
  });

  it("別タイプ・別 poemId なら追加される", () => {
    addToReviewList({ type: "range", poemId: 1, range: "1-4" });
    addToReviewList({ type: "all", poemId: 1 });
    addToReviewList({ type: "range", poemId: 2, range: "1-4" });
    expect(getReviewList()).toHaveLength(3);
  });
});

describe("removeFromReviewList", () => {
  it("指定 id を削除する", () => {
    addToReviewList({ type: "range", poemId: 1, range: "1-4" });
    const list = getReviewList();
    const id = list[0].id;
    removeFromReviewList(id);
    expect(getReviewList()).toHaveLength(0);
  });

  it("存在しない id では変化なし", () => {
    addToReviewList({ type: "range", poemId: 1, range: "1-4" });
    removeFromReviewList("no-such-id");
    expect(getReviewList()).toHaveLength(1);
  });
});
