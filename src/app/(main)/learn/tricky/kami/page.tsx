"use client";

import Link from "next/link";
import { KAMI_TRICKY_SETS } from "@/data/tricky-questions";

export default function KamiTrickyPage() {
  return (
    <div className="container max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">上の句がまぎらわしい問題</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
        {KAMI_TRICKY_SETS.map((set) => (
          <Link
            key={set.id}
            href={`/learn/tricky/kami/${set.id}`}
            className="btn btn-outline btn-sm"
          >
            その{set.id}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Link href="/learn/tricky/kami/test" className="btn btn-primary">
          まとめてテスト
        </Link>
      </div>

      <Link href="/learn/tricky" className="btn btn-outline">
        戻る
      </Link>
    </div>
  );
}
