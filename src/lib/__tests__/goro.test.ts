import { goroToSearch, findGoroRange } from "@/lib/goro";

describe("goroToSearch", () => {
  it("～を除去して trim する", () => {
    expect(goroToSearch("あ～り")).toBe("あり");
    expect(goroToSearch("  ～  ")).toBe("");
  });

  it("空文字や空白のみ", () => {
    expect(goroToSearch("")).toBe("");
    expect(goroToSearch("   ")).toBe("");
  });
});

describe("findGoroRange", () => {
  it("空の語呂や空のひらがなのときは { start: 0, length: 0 }", () => {
    expect(findGoroRange("", "あ")).toEqual({ start: 0, length: 0 });
    expect(findGoroRange("あいうえお", "")).toEqual({ start: 0, length: 0 });
  });

  it("完全一致で開始位置と長さを返す", () => {
    expect(findGoroRange("ありあけのつきを", "あり")).toEqual({ start: 0, length: 2 });
    expect(findGoroRange("ありあけのつきを", "つき")).toEqual({ start: 5, length: 2 });
  });

  it("スペースを無視して検索する", () => {
    expect(findGoroRange("あり あけの つきを", "ありあけ")).toEqual({ start: 0, length: 5 });
  });

  it("正規化（が→か）でマッチする", () => {
    expect(findGoroRange("かきくけこ", "がき")).toEqual({ start: 0, length: 2 });
  });

  it("マッチしないときはフォールバックで最初の1文字", () => {
    expect(findGoroRange("あいう", "xyz")).toEqual({ start: 0, length: 1 });
  });

  it("語呂に～が含まれる場合は除去して検索", () => {
    expect(findGoroRange("ありあけ", "あ～り")).toEqual({ start: 0, length: 2 });
  });
});
