import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * GET /api/test-clears
 * ログインユーザーのクリア状態を取得
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
      return NextResponse.json({ clears: [] }, { status: 200 });
    }

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL が設定されていません");
    }

    const sql = neon(connectionString);
    const rows = await sql`
      SELECT test_type, range
      FROM user_test_clears
      WHERE user_id = ${user.id}
      ORDER BY range, test_type
    `;

    return NextResponse.json({ clears: rows });
  } catch (err) {
    console.error("test-clears API error:", err);
    return NextResponse.json(
      { error: "クリア状態の取得に失敗しました" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/test-clears
 * クリア状態を保存
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
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { testType, range: testRange } = body;

    if (!testType || !testRange) {
      return NextResponse.json(
        { error: "testType と range が必要です" },
        { status: 400 }
      );
    }

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL が設定されていません");
    }

    const sql = neon(connectionString);
    await sql`
      INSERT INTO user_test_clears (user_id, test_type, range)
      VALUES (${user.id}, ${testType}, ${testRange})
      ON CONFLICT (user_id, test_type, range)
      DO UPDATE SET cleared_at = NOW(), updated_at = NOW()
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("test-clears POST API error:", err);
    return NextResponse.json(
      { error: "クリア状態の保存に失敗しました" },
      { status: 500 }
    );
  }
}
