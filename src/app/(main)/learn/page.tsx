"use client";

import { useState } from "react";
import Link from "next/link";

export default function LearnListPage() {
  const [open1_4, setOpen1_4] = useState(false);

  return (
    <div className="container max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">学習リスト</h1>

      {/* 1～4首ブロックのみ（今回の範囲） */}
      <div className="border border-base-300 rounded-xl overflow-hidden">
        <button
          type="button"
          className="w-full flex items-center justify-between p-4 bg-base-200 hover:bg-base-300 text-left font-medium"
          onClick={() => setOpen1_4((o) => !o)}
          aria-expanded={open1_4}
        >
          <span>1～4首</span>
          <svg
            className={`w-5 h-5 transition-transform ${open1_4 ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open1_4 && (
          <div className="p-4 bg-base-100 border-t border-base-300 flex flex-col gap-2">
            <Link
              href="/learn/1-4/study"
              className="btn btn-primary btn-block btn-sm sm:btn-md"
            >
              学習
            </Link>
            <Link
              href="/learn/1-4/test"
              className="btn btn-outline btn-block btn-sm sm:btn-md"
            >
              4首でテスト
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
