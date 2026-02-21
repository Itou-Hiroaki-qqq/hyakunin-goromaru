/**
 * @jest-environment node
 */
import { GET, POST } from "@/app/api/test-clears/route";

const mockGetUser = jest.fn();
const mockCookiesGetAll = jest.fn();

jest.mock("next/headers", () => ({
  cookies: jest.fn(() =>
    Promise.resolve({
      getAll: mockCookiesGetAll,
    })
  ),
}));

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

const mockSql = jest.fn();
jest.mock("@neondatabase/serverless", () => ({
  neon: jest.fn(() => mockSql),
}));

const originalEnv = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  process.env = {
    ...originalEnv,
    DATABASE_URL: "postgres://test",
    NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  };
});

afterAll(() => {
  process.env = originalEnv;
});

describe("GET /api/test-clears", () => {
  it("未認証のとき clears: [] を 200 で返す", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.clears).toEqual([]);
    expect(mockSql).not.toHaveBeenCalled();
  });

  it("認証済みのとき Neon の結果を返す", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockSql.mockResolvedValue([
      { test_type: "range", range: "1-4" },
    ]);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.clears).toEqual([{ test_type: "range", range: "1-4" }]);
    expect(mockSql).toHaveBeenCalled();
  });
});

describe("POST /api/test-clears", () => {
  it("未認証のとき 401", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ testType: "range", range: "1-4" }),
        headers: { "Content-Type": "application/json" },
      })
    );
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("認証が必要です");
  });

  it("body に testType と range がないと 400", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "Content-Type": "application/json" },
      })
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("testType と range が必要です");
  });

  it("認証済みで testType と range を送ると 200 で success", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    mockSql.mockResolvedValue(undefined);

    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ testType: "range", range: "1-4" }),
        headers: { "Content-Type": "application/json" },
      })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockSql).toHaveBeenCalled();
  });
});
