import Link from "next/link";

export default function ReviewPage() {
  return (
    <div className="container max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">復習ページ</h1>
      <p className="text-base-content/80 mb-4">
        テストで間違えた問題を復習できます。実装は続きのステップで行います。
      </p>
      <Link href="/learn" className="btn btn-outline">
        学習リストへ戻る
      </Link>
    </div>
  );
}
