"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Poem } from "@/types/poem";
import { playOnce, playSequence, stopAll } from "@/lib/audio";
import { findGoroRange } from "@/lib/goro";
import { parseRange } from "@/lib/range";
import { addToReviewList, type ReviewItem } from "@/lib/reviewStorage";
import { PoemCard, ChoiceCard } from "@/components/QuizCard";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let goroRunInProgress = false;

export default function TestRangePage() {
  const params = useParams();
  const range = parseRange(params.range as string | undefined);

  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<number[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [choices, setChoices] = useState<{ text: string; poemId: number }[]>([]);
  const [clickedWrong, setClickedWrong] = useState<string[]>([]);
  const [selectedCorrect, setSelectedCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [perfectScore, setPerfectScore] = useState(0); // 一発正解数
  const lastPlayedQRef = useRef<number | null>(null);
  const [showGoro, setShowGoro] = useState(false);
  const [goroPlayKey, setGoroPlayKey] = useState(0);
  const [goroHighlightPhase, setGoroHighlightPhase] = useState<"none" | "kami" | "shimo">("none");
  const currentGoroPoemIdRef = useRef<number | null>(null);
  const lastGoroPlayKeyRef = useRef<number>(-1);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    return () => {
      stopAll();
      goroRunInProgress = false;
    };
  }, []);

  const rangeKey = typeof params.range === "string" ? params.range : "";
  useEffect(() => {
    if (!range) {
      setLoading(false);
      setError("範囲が不正です");
      return;
    }
    const { from, to } = range;
    fetch(`/api/poems?from=${from}&to=${to}`)
      .then((res) => {
        if (!res.ok) throw new Error("取得に失敗しました");
        return res.json();
      })
      .then((data: Poem[]) => {
        setPoems(data);
        setOrder(data.map((_, i) => i));
        setError("");
      })
      .catch((err) => setError(err.message || "エラー"))
      .finally(() => setLoading(false));
  }, [rangeKey]);

  const poemIndex = order[currentQ];
  const current = poemIndex != null ? poems[poemIndex] : null;
  const isLastQuestion = currentQ >= poems.length - 1;
  const finished = showResult;
  const rangeLabel = range ? `${range.from}-${range.to}` : "";
  const is20Test = range ? range.to - range.from + 1 === 20 : false;
  const isSummaryTest = range ? range.from === 1 && range.to > 4 : false; // 結果タイトル用（従来のまとめ範囲）

  useEffect(() => {
    if (finished && poems.length > 0 && range && current) {
      stopAll();
      // 最後の1問で間違えていたら復習に追加
      if (clickedWrong.length > 0) {
        addToReviewList({
          type: "range",
          poemId: current.id,
          range: `${range.from}-${range.to}`,
        } as Omit<ReviewItem, "id">);
      }
      // 全問一発正解ならクリア状態を保存
      if (perfectScore === poems.length) {
        const from = range.from;
        const to = range.to;
        const is4Test = to - from + 1 === 4;
        const is8Test = to - from + 1 === 8;
        const is20Test = to - from + 1 === 20;
        
        let testType = "";
        if (is20Test) {
          testType = "20首";
        } else if (is8Test) {
          testType = "8首";
        } else if (is4Test) {
          testType = "4首";
        }
        
        if (testType) {
          fetch("/api/test-clears", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              testType,
              range: `${from}-${to}`,
            }),
          }).catch((err) => console.error("クリア状態の保存に失敗:", err));
        }
      }
    }
  }, [finished, poems.length, perfectScore, range, current?.id, clickedWrong.length, current]);

  useEffect(() => {
    if (!current || poems.length === 0) return;
    currentGoroPoemIdRef.current = current.id;
    goroRunInProgress = false;
    lastGoroPlayKeyRef.current = -1;
    const others = poems.filter((p) => p.id !== current.id);
    const wrong = others.map((p) => ({ text: p.shimo_hiragana, poemId: p.id }));
    const four = shuffle([
      { text: current.shimo_hiragana, poemId: current.id },
      ...wrong.slice(0, 3),
    ]);
    setChoices(four);
    setClickedWrong([]);
    setSelectedCorrect(false);
    setShowGoro(false);
    setGoroPlayKey(0);
    setGoroHighlightPhase("none");
    setShowResult(false);
  }, [currentQ, poems.length, current?.id]);

  useEffect(() => {
    if (!showGoro || !current || goroPlayKey <= 0) return;
    if (!selectedCorrect) return;
    if (goroRunInProgress) return;
    if (lastGoroPlayKeyRef.current === goroPlayKey) return;
    lastGoroPlayKeyRef.current = goroPlayKey;
    goroRunInProgress = true;
    const poemId = current.id;
    setGoroHighlightPhase("kami");
    const run = async () => {
      try {
        if (currentGoroPoemIdRef.current !== poemId) return;
        if (current.kami_goro_audio_url) await playOnce(current.kami_goro_audio_url);
        if (currentGoroPoemIdRef.current !== poemId) return;
        setGoroHighlightPhase("shimo");
        if (current.shimo_goro_audio_url) await playOnce(current.shimo_goro_audio_url);
      } finally {
        goroRunInProgress = false;
      }
    };
    run();
  }, [goroPlayKey, showGoro, current?.id, selectedCorrect]);

  useEffect(() => {
    if (!showGoro || !current || goroPlayKey <= 0) return;
    if (selectedCorrect) return;
    const urls: string[] = [];
    if (current.kami_goro_audio_url) urls.push(current.kami_goro_audio_url);
    if (current.shimo_goro_audio_url) urls.push(current.shimo_goro_audio_url);
    if (urls.length > 0) playSequence(urls);
  }, [goroPlayKey, showGoro, current, selectedCorrect]);

  useEffect(() => {
    if (!current?.kami_audio_url || poems.length === 0) return;
    if (lastPlayedQRef.current === currentQ) return;
    if (lastPlayedQRef.current != null) stopAll();
    lastPlayedQRef.current = currentQ;
    playOnce(current.kami_audio_url);
  }, [currentQ, poems.length, current?.id, current?.kami_audio_url]);

  const handleAnswer = (answer: string) => {
    if (selectedCorrect) return;
    stopAll();
    if (answer === current?.shimo_hiragana) {
      setSelectedCorrect(true);
      setScore((s) => s + 1);
      setShowGoro(true);
      setGoroPlayKey((k) => k + 1);
      if (clickedWrong.length === 0) {
        setPerfectScore((s) => s + 1);
      }
    } else if (!clickedWrong.includes(answer)) {
      setClickedWrong((prev) => [...prev, answer]);
      setShowGoro(true);
      setGoroPlayKey((k) => k + 1);
    }
  };

  const handleNext = () => {
    stopAll();
    goroRunInProgress = false;
    if (current && clickedWrong.length > 0 && range) {
      addToReviewList({
        type: "range",
        poemId: current.id,
        range: `${range.from}-${range.to}`,
      } as Omit<ReviewItem, "id">);
    }
    if (isLastQuestion) {
      // 結果画面へ移るため、語呂再生の非同期 run() が続けて下の句を流さないようにする
      currentGoroPoemIdRef.current = null;
      setShowResult(true);
      return;
    }
    const nextIdx = order[currentQ + 1];
    const nextPoem = nextIdx != null ? poems[nextIdx] : null;
    if (nextPoem) currentGoroPoemIdRef.current = nextPoem.id;
    setSelectedCorrect(false);
    setClickedWrong([]);
    setShowGoro(false);
    setGoroPlayKey(0);
    setGoroHighlightPhase("none");
    setCurrentQ((q) => q + 1);
  };

  if (!range) {
    return (
      <div className="container max-w-2xl mx-auto p-6">
        <p className="text-error mb-4">範囲が不正です</p>
        <Link href="/learn" className="btn btn-outline">
          学習リストへ戻る
        </Link>
      </div>
    );
  }

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
    const resultTitle = is20Test
      ? `${range?.from ?? 0}～${range?.to ?? 0}首テスト 結果`
      : isSummaryTest
        ? "ここまでのまとめテスト 結果"
        : `${poems.length}首でテスト 結果`;

    const from = range?.from ?? 0;
    const to = range?.to ?? 0;
    const is4Test = range && to - from + 1 === 4;
    const blockIndex = from > 0 ? Math.ceil(from / 4) : 0;
    const has8Test = blockIndex >= 2 && blockIndex % 2 === 0;
    const from8 = has8Test ? 4 * blockIndex - 7 : 0;
    const to8 = has8Test ? 4 * blockIndex : 0;
    const show8TestOn4Result = is4Test && has8Test;
    const is8Test = range && to - from + 1 === 8;
    const isFinalResult = is20Test || is8Test || is4Test;
    const nextFourFrom = to < 100 ? to + 1 : 0;
    const nextFourTo = to < 100 ? to + 4 : 0;
    const showNextFour = isFinalResult && to < 100 && !is20Test;

    // 4首テスト or 8首テストの結果ページで、該当ブロックなら20首テストへ進むボタンを表示
    const show20TestLink =
      !is20Test &&
      ((is4Test && from === 17 && to === 20) ||
        (is8Test && from === 33 && to === 40) ||
        (is4Test && from === 57 && to === 60) ||
        (is8Test && from === 73 && to === 80) ||
        (is8Test && from === 93 && to === 100));
    const twentyTestRange = show20TestLink
      ? from <= 20
        ? "1-20"
        : from <= 40
          ? "21-40"
          : from <= 60
            ? "41-60"
            : from <= 80
              ? "61-80"
              : "81-100"
      : "";
    const twentyTestLabel =
      twentyTestRange === "1-20"
        ? "1～20首テストへ進む"
        : twentyTestRange === "21-40"
          ? "21～40首テストへ進む"
          : twentyTestRange === "41-60"
            ? "41～60首テストへ進む"
            : twentyTestRange === "61-80"
              ? "61～80首テストへ進む"
              : twentyTestRange === "81-100"
                ? "81～100首テストへ進む"
                : "";

    const showAll100Link = is20Test && from === 81 && to === 100;

    return (
      <div className="container max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">{resultTitle}</h2>
        <p className="text-lg mb-6">
          正解数：{score} / {poems.length} 首
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href={`/learn/${rangeLabel}/study`} className="btn btn-outline">
            もう一度学習する
          </Link>
          {show8TestOn4Result && (
            <Link
              href={`/learn/${from8}-${to8}/test`}
              className="btn btn-outline"
            >
              前回も入れて8首でテスト
            </Link>
          )}
          {show20TestLink && twentyTestLabel && (
            <Link
              href={`/learn/${twentyTestRange}/test`}
              className="btn btn-outline"
            >
              {twentyTestLabel}
            </Link>
          )}
          {showNextFour && (
            <Link
              href={`/learn/${nextFourFrom}-${nextFourTo}/study`}
              className="btn btn-outline"
            >
              次の4首に進む
            </Link>
          )}
          {showAll100Link && (
            <Link href="/learn/all/test" className="btn btn-outline">
              100首ぜんぶテストへ進む
            </Link>
          )}
          <Link href="/learn" className="btn btn-primary">
            学習リストへ戻る
          </Link>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const kamiGoroRange = findGoroRange(current.kami_hiragana, current.kami_goro);
  const shimoGoroRange = findGoroRange(current.shimo_hiragana, current.shimo_goro);
  const showKamiHighlight =
    selectedCorrect && (goroHighlightPhase === "kami" || goroHighlightPhase === "shimo");
  const showShimoHighlight = selectedCorrect && goroHighlightPhase === "shimo";

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
              showKamiHighlight && kamiGoroRange.length > 0 ? kamiGoroRange : undefined
            }
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {choices.map((item) => {
            const isCorrectChoice = item.text === current.shimo_hiragana;
            const showShimoGoro = showShimoHighlight && isCorrectChoice;
            const choiceShimoRange = showShimoGoro ? shimoGoroRange : undefined;
            return (
              <ChoiceCard
                key={`${item.poemId}-${item.text.slice(0, 8)}`}
                text={item.text}
                onClick={() => handleAnswer(item.text)}
                disabled={selectedCorrect}
                result={
                  selectedCorrect && isCorrectChoice
                    ? "correct"
                    : clickedWrong.includes(item.text)
                      ? "wrong"
                      : null
                }
                highlightRange={choiceShimoRange}
              />
            );
          })}
        </div>
        {showGoro && current.goro_kaisetsu && (
          <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/30 mb-4">
            <p className="text-xs font-medium text-base-content/60 mb-1">語呂の意味</p>
            <p className="text-xl font-bold text-base-content">
              {current.goro_kaisetsu}
            </p>
          </div>
        )}
        {selectedCorrect && !finished && (
          <div className="flex justify-center gap-4">
            <Link href={`/learn/${rangeLabel}/study`} className="btn btn-ghost">
              学習に戻る
            </Link>
            <button type="button" className="btn btn-primary" onClick={handleNext}>
              {isLastQuestion ? "次へ" : "次の問題"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
