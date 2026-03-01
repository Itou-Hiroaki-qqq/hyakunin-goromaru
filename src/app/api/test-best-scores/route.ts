import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * GET /api/test-best-scores
 * ログインユーザーの最高一発正解数を取得
 * 未ログイン時は { scores: {}, loggedIn: false }
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ scores: {}, loggedIn: false }, { status: 200 });
    }

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL が設定されていません");
    }

    const sql = neon(connectionString);
    const rows = (await sql`
      SELECT test_key, best_score
      FROM user_test_best_scores
      WHERE user_id = ${user.id}
    `) as { test_key: string; best_score: number }[];

    const scores: Record<string, number> = {};
    rows.forEach((r) => {
      scores[r.test_key] = r.best_score;
    });

    return NextResponse.json({ scores, loggedIn: true });
  } catch (err) {
    console.error("test-best-scores GET error:", err);
    return NextResponse.json(
      { error: "最高一発正解数の取得に失敗しました" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/test-best-scores
 * 今回の一発正解数がこれまでの最高を上回る場合のみ保存
 */
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ saved: false, loggedIn: false }, { status: 200 });
    }

    const body = await request.json();
    const { testKey, score } = body;

    if (typeof testKey !== "string" || typeof score !== "number") {
      return NextResponse.json(
        { error: "testKey (string) と score (number) が必要です" },
        { status: 400 }
      );
    }

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL が設定されていません");
    }

    const sql = neon(connectionString);
    await sql`
      INSERT INTO user_test_best_scores (user_id, test_key, best_score)
      VALUES (${user.id}, ${testKey}, ${score})
      ON CONFLICT (user_id, test_key)
      DO UPDATE SET
        best_score = GREATEST(user_test_best_scores.best_score, EXCLUDED.best_score),
        updated_at = NOW()
    `;

    return NextResponse.json({ saved: true, loggedIn: true });
  } catch (err) {
    console.error("test-best-scores POST error:", err);
    return NextResponse.json(
      { error: "最高一発正解数の保存に失敗しました" },
      { status: 500 }
    );
  }
}
