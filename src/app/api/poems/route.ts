import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import type { Poem } from "@/types/poem";

/** 1～4首のフォールバック用（Neon 接続失敗時） */
async function getFallbackPoems1To4(): Promise<Poem[]> {
  const data = await import("@/data/poems-1-4.json");
  return data.default as Poem[];
}

/**
 * GET /api/poems
 * 全句取得。クエリ ?from=1&to=4 で範囲指定可能。
 * from=1&to=4 のときは Neon 失敗時に静的データを返す。
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const is1To4 = from === "1" && to === "4";

  const tryNeon = async (): Promise<Poem[]> => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL が設定されていません");

    const sql = neon(connectionString);

    const fromNum = from != null ? parseInt(from, 10) : NaN;
    const toNum = to != null ? parseInt(to, 10) : NaN;
    const hasRange =
      !Number.isNaN(fromNum) && !Number.isNaN(toNum) && from != null && to != null;

    type Row = {
      id: number;
      kami: string;
      shimo: string;
      kami_hiragana: string;
      shimo_hiragana: string;
      kami_tts: string;
      shimo_tts: string;
      kami_goro_tts: string;
      shimo_goro_tts: string;
      kami_goro: string;
      shimo_goro: string;
      goro_kaisetsu: string;
      kami_audio_url: string;
      shimo_audio_url: string;
      kami_goro_audio_url: string;
      shimo_goro_audio_url: string;
    };

    const rows = (hasRange
      ? await sql`
          SELECT id, kami, shimo, kami_hiragana, shimo_hiragana,
                 kami_tts, shimo_tts, kami_goro_tts, shimo_goro_tts,
                 kami_goro, shimo_goro, goro_kaisetsu,
                 kami_audio_url, shimo_audio_url,
                 kami_goro_audio_url, shimo_goro_audio_url
          FROM poems
          WHERE id >= ${fromNum} AND id <= ${toNum}
          ORDER BY id ASC
        `
      : await sql`
          SELECT id, kami, shimo, kami_hiragana, shimo_hiragana,
                 kami_tts, shimo_tts, kami_goro_tts, shimo_goro_tts,
                 kami_goro, shimo_goro, goro_kaisetsu,
                 kami_audio_url, shimo_audio_url,
                 kami_goro_audio_url, shimo_goro_audio_url
          FROM poems
          ORDER BY id ASC
        `) as Row[];

    return rows.map((row) => ({
      id: row.id,
      kami: row.kami,
      shimo: row.shimo,
      kami_hiragana: row.kami_hiragana,
      shimo_hiragana: row.shimo_hiragana,
      kami_tts: row.kami_tts,
      shimo_tts: row.shimo_tts,
      kami_goro_tts: row.kami_goro_tts,
      shimo_goro_tts: row.shimo_goro_tts,
      kami_goro: row.kami_goro,
      shimo_goro: row.shimo_goro,
      goro_kaisetsu: row.goro_kaisetsu,
      kami_audio_url: row.kami_audio_url,
      shimo_audio_url: row.shimo_audio_url,
      kami_goro_audio_url: row.kami_goro_audio_url,
      shimo_goro_audio_url: row.shimo_goro_audio_url,
    }));
  };

  try {
    const poems = await tryNeon();
    return NextResponse.json(poems);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("poems API error:", err);

    if (is1To4) {
      try {
        const fallback = await getFallbackPoems1To4();
        return NextResponse.json(fallback);
      } catch (fallbackErr) {
        console.error("fallback error:", fallbackErr);
      }
    }

    return NextResponse.json(
      {
        error: "句の取得に失敗しました",
        ...(process.env.NODE_ENV === "development" && { detail: message }),
      },
      { status: 500 }
    );
  }
}
