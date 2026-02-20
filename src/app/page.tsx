"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getReviewList } from "@/lib/reviewStorage";

export default function Home() {
  const pathname = usePathname();
  const [hasReview, setHasReview] = useState(false);

  useEffect(() => {
    setHasReview(getReviewList().length > 0);
  }, [pathname]);

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold text-center mb-8 leading-tight">
        百人一首
        <br />
        -ゴロでマル覚え-
      </h1>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link href="/learn" className="btn btn-primary btn-lg">
          学習スタート
        </Link>
        {hasReview ? (
          <Link href="/review" className="btn btn-outline btn-lg">
            復習
          </Link>
        ) : (
          <button type="button" className="btn btn-outline btn-lg" disabled>
            復習
          </button>
        )}
      </div>
      <footer className="mt-auto py-6 text-sm text-base-content/60">
        All Rights Reserved 2026 © Hiroaki Ito
      </footer>
    </main>
  );
}
