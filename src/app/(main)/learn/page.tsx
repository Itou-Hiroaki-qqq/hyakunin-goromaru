"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/** 4首ブロックの定義（1～4, 5～8, ..., 97～100） */
const BLOCKS = Array.from({ length: 25 }, (_, i) => {
  const from = i * 4 + 1;
  const to = (i + 1) * 4;
  return { from, to, key: `${from}-${to}` };
});

type ClearStatus = {
  test_type: string;
  range: string;
};

export default function LearnListPage() {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [clears, setClears] = useState<ClearStatus[]>([]);

  useEffect(() => {
    fetch("/api/test-clears")
      .then((res) => res.json())
      .then((data: { clears: ClearStatus[] }) => {
        setClears(data.clears || []);
      })
      .catch((err) => console.error("クリア状態の取得に失敗:", err));
  }, []);

  const isCleared = (testType: string, range: string): boolean => {
    return clears.some((c) => c.test_type === testType && c.range === range);
  };

  const isTrickyFullyCleared =
    isCleared("tricky_kami", "summary") && isCleared("tricky_shimo", "summary");

  return (
    <div className="container max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">学習リスト</h1>

      <div className="flex flex-col gap-3">
        {BLOCKS.map(({ from, to, key }) => {
          const isOpen = openKey === key;
          const blockIndex = Math.ceil(from / 4); // 1-based: 1～25（1-4→1, 5-8→2, ...）
          const has8Test = (blockIndex >= 2 && blockIndex % 2 === 0) || blockIndex === 25; // 2,4,6,...,24,25 → 前回も入れて8首でテスト
          const has20Test = blockIndex % 5 === 0 && blockIndex >= 5; // 5,10,15,20,25 → 17-20,37-40,57-60,77-80,97-100 に20首テスト
          const from8 = has8Test ? (blockIndex === 25 ? 93 : 4 * blockIndex - 7) : 0;
          const to8 = has8Test ? (blockIndex === 25 ? 100 : 4 * blockIndex) : 0;
          const group20 = has20Test ? blockIndex / 5 : 0; // 1,2,3,4,5
          const from20 = has20Test ? (group20 - 1) * 20 + 1 : 0;
          const to20 = has20Test ? group20 * 20 : 0;
          const twentyTestLabel =
            blockIndex === 5
              ? "1～20首テスト"
              : blockIndex === 10
                ? "21～40首テスト"
                : blockIndex === 15
                  ? "41～60首テスト"
                  : blockIndex === 20
                    ? "61～80首テスト"
                    : "81～100首テスト";

          // クリア状態を判定
          let isBlockCleared = false;
          if (has20Test) {
            isBlockCleared = isCleared("20首", `${from20}-${to20}`);
          } else if (has8Test) {
            isBlockCleared = isCleared("8首", `${from8}-${to8}`);
          } else {
            isBlockCleared = isCleared("4首", `${from}-${to}`);
          }

          return (
            <div key={key} className="border border-base-300 rounded-xl overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between p-4 bg-base-200 hover:bg-base-300 text-left font-medium"
                onClick={() => setOpenKey((k) => (k === key ? null : key))}
                aria-expanded={isOpen}
              >
                <span className="flex items-center gap-2">
                  {isBlockCleared && (
                    <span className="text-yellow-500 text-xl">★</span>
                  )}
                  <span>{from}～{to}首</span>
                </span>
                <svg
                  className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isOpen && (
                <div className="p-4 bg-base-100 border-t border-base-300 flex flex-col gap-2">
                  <Link
                    href={`/learn/${from}-${to}/study`}
                    className="btn btn-primary btn-block btn-sm sm:btn-md"
                  >
                    学習
                  </Link>
                  <Link
                    href={`/learn/${from}-${to}/test`}
                    className="btn btn-outline btn-block btn-sm sm:btn-md"
                  >
                    4首でテスト
                  </Link>
                  {has8Test && (
                    <Link
                      href={`/learn/${from8}-${to8}/test`}
                      className="btn btn-outline btn-block btn-sm sm:btn-md"
                    >
                      前回も入れて8首でテスト
                    </Link>
                  )}
                  {has20Test && (
                    <Link
                      href={`/learn/${from20}-${to20}/test`}
                      className="btn btn-outline btn-block btn-sm sm:btn-md"
                    >
                      {twentyTestLabel}
                    </Link>
                  )}
                </div>
              )}
            </div>
          );
        })}
        
        {/* 100首ぜんぶテスト */}
        <div className="border border-base-300 rounded-xl overflow-hidden mt-2">
          <Link
            href="/learn/all/test"
            className="w-full flex items-center justify-between p-4 bg-base-200 hover:bg-base-300 text-left font-medium"
          >
            <span className="flex items-center gap-2">
              {isCleared("100首", "all") && (
                <span className="text-yellow-500 text-xl">★</span>
              )}
              <span>100首ぜんぶテスト</span>
            </span>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* 境界線 */}
        <div className="divider my-4" />

        {/* 間違えやすい問題 */}
        <div className="border border-base-300 rounded-xl overflow-hidden">
          <Link
            href="/learn/tricky"
            className="w-full flex items-center justify-between p-4 bg-base-200 hover:bg-base-300 text-left font-medium"
          >
            <span className="flex items-center gap-2">
              {isTrickyFullyCleared && (
                <span className="text-yellow-500 text-xl">★</span>
              )}
              <span>間違えやすい問題</span>
            </span>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
