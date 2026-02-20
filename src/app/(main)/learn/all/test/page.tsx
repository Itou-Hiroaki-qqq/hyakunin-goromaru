"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Poem } from "@/types/poem";
import { playOnce, stopAll } from "@/lib/audio";
import { findGoroRange } from "@/lib/goro";
import { PoemCard, ChoiceCard } from "@/components/QuizCard";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function AllTestPage() {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const [choices, setChoices] = useState<{ text: string; poemId: number }[]>([]);
  const [clickedWrong, setClickedWrong] = useState<string[]>([]);
  const [selectedCorrect, setSelectedCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [perfectScore, setPerfectScore] = useState(0); // 一発正解数
  const lastPlayedQRef = useRef<number | null>(null);

  useEffect(() => {
    return () => { stopAll(); };
  }, []);

  useEffect(() => {
    fetch("/api/poems?from=1&to=100")
      .then((res) => {
        if (!res.ok) throw new Error("取得に失敗しました");
        return res.json();
      })
      .then((data: Poem[]) => {
        setPoems(data);
        setError("");
      })
      .catch((err) => setError(err.message || "エラー"))
      .finally(() => setLoading(false));
  }, []);

  const current = poems[currentQ] || null;
  const finished = selectedCorrect && currentQ >= poems.length - 1;

  useEffect(() => {
    if (finished && poems.length > 0) stopAll();
  }, [finished, poems.length]);

  useEffect(() => {
    if (!current || poems.length === 0) return;
    // 残り99首からランダム3つを選ぶ
    const others = poems.filter((p) => p.id !== current.id);
    const wrong = shuffle(others).slice(0, 3).map((p) => ({ text: p.shimo_hiragana, poemId: p.id }));
    const four = shuffle([
      { text: current.shimo_hiragana, poemId: current.id },
      ...wrong,
    ]);
    setChoices(four);
    setClickedWrong([]);
    setSelectedCorrect(false);
  }, [currentQ, poems.length, current?.id]);

  useEffect(() => {
    if (!current?.kami_audio_url || poems.length === 0) return;
    if (lastPlayedQRef.current === currentQ) return;
    if (lastPlayedQRef.current != null) stopAll();
    lastPlayedQRef.current = currentQ;
    playOnce(current.kami_audio_url);
  }, [currentQ, poems.length, current?.id, current?.kami_audio_url]);

  const handleAnswer = (answer: string) => {
    if (selectedCorrect) return;
    if (answer === current?.shimo_hiragana) {
      setSelectedCorrect(true);
      setScore((s) => s + 1);
      // 一発正解（×がついていない）ならカウント
      if (clickedWrong.length === 0) {
        setPerfectScore((s) => s + 1);
      }
    } else if (!clickedWrong.includes(answer)) {
      setClickedWrong((prev) => [...prev, answer]);
    }
  };

  const handleNext = () => {
    if (currentQ >= poems.length - 1) return;
    setCurrentQ((q) => q + 1);
  };

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto p-6 flex justify-center items-center min-h-[40vh]">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (error || poems.length === 0) {
    return (
      <div className="container max-w-2xl mx-auto p-6">
        <p className="text-error mb-4">{error || "データがありません"}</p>
        <Link href="/learn" className="btn btn-outline">
          学習リストへ戻る
        </Link>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="container max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">100首ぜんぶテスト 結果</h2>
        <p className="text-lg mb-6">
          一発正解数：{perfectScore} / {poems.length} 首
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="/learn" className="btn btn-primary">
            学習リストへ戻る
          </Link>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const kamiGoroRange = findGoroRange(current.kami_hiragana, current.kami_goro);

  return (
    <div className="min-h-[60vh] p-6 bg-tatami">
      <p className="text-sm text-base-content/60 mb-2">
        問題 {currentQ + 1} / {poems.length}
      </p>
      <div className="max-w-2xl mx-auto">
        <p className="text-center text-lg mb-4">上の句（ひらがな）の続きはどれ？</p>
        <div className="mb-6 flex justify-center">
          <PoemCard
            text={current.kami_hiragana}
            variant="kami"
            highlightRange={
              kamiGoroRange.length > 0 ? kamiGoroRange : undefined
            }
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {choices.map((item) => (
            <ChoiceCard
              key={`${item.poemId}-${item.text.slice(0, 8)}`}
              text={item.text}
              onClick={() => handleAnswer(item.text)}
              disabled={selectedCorrect}
              result={
                selectedCorrect && item.text === current.shimo_hiragana
                  ? "correct"
                  : clickedWrong.includes(item.text)
                    ? "wrong"
                    : null
              }
            />
          ))}
        </div>
        {selectedCorrect && !finished && (
          <div className="flex justify-center gap-4">
            <button type="button" className="btn btn-primary" onClick={handleNext}>
              次の問題
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
