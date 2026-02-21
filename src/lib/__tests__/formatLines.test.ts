import { splitToLines } from "@/lib/formatLines";

describe("splitToLines", () => {
  it("スペースで分割し指定行数まで返す", () => {
    expect(splitToLines("あ い う え", 2)).toEqual(["あ", "い"]);
    expect(splitToLines("あ い う え", 3)).toEqual(["あ", "い", "う"]);
  });

  it("パーツが maxLines 未満のときはそのまま返す", () => {
    expect(splitToLines("あ い", 3)).toEqual(["あ", "い"]);
  });

  it("スペースがなく長文・2行指定のときは文字数で半分に折り返す", () => {
    const text = "あいうえおかきく";
    const result = splitToLines(text, 2);
    expect(result).toHaveLength(2);
    expect(result[0].length + result[1].length).toBe(text.length);
    expect(result[0] + result[1]).toBe(text);
  });

  it("空文字のとき", () => {
    expect(splitToLines("", 2)).toEqual([]);
  });

  it("スペースのみのときは元テキストを1要素で返す", () => {
    expect(splitToLines("   ", 2)).toEqual(["   "]);
  });
});
