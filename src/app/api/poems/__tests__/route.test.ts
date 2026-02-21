/**
 * @jest-environment node
 */
import { GET } from "@/app/api/poems/route";

const mockSql = jest.fn();
jest.mock("@neondatabase/serverless", () => ({
  neon: jest.fn(() => mockSql),
}));

const originalEnv = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...originalEnv, DATABASE_URL: "postgres://test" };
});

afterAll(() => {
  process.env = originalEnv;
});

function createRequest(url = "http://localhost/api/poems") {
  return new Request(url);
}

describe("GET /api/poems", () => {
  it("from/to なしで Neon が返した全件を JSON で返す", async () => {
    const rows = [
      {
        id: 1,
        kami: "上",
        shimo: "下",
        kami_hiragana: "かみ",
        shimo_hiragana: "しも",
        kami_tts: "",
        shimo_tts: "",
        kami_goro_tts: "",
        shimo_goro_tts: "",
        kami_goro: "",
        shimo_goro: "",
        goro_kaisetsu: "",
        kami_audio_url: "",
        shimo_audio_url: "",
        kami_goro_audio_url: "",
        shimo_goro_audio_url: "",
      },
    ];
    mockSql.mockResolvedValue(rows);

    const res = await GET(createRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe(1);
    expect(data[0].kami).toBe("上");
  });

  it("from=1&to=4 のとき Neon を呼び 200 で返す", async () => {
    mockSql.mockResolvedValue([]);

    const res = await GET(
      createRequest("http://localhost/api/poems?from=1&to=4")
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(mockSql).toHaveBeenCalled();
  });

  it("Neon が失敗し from=1&to=4 のときフォールバック JSON を返す", async () => {
    mockSql.mockRejectedValue(new Error("connection failed"));

    const res = await GET(
      createRequest("http://localhost/api/poems?from=1&to=4")
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty("id");
    expect(data[0]).toHaveProperty("kami");
  });

  it("Neon が失敗し 1-4 以外のとき 500 とエラーメッセージを返す", async () => {
    mockSql.mockRejectedValue(new Error("connection failed"));

    const res = await GET(
      createRequest("http://localhost/api/poems?from=5&to=10")
    );
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("句の取得に失敗しました");
  });

  it("DATABASE_URL 未設定で Neon を呼ぶと 500", async () => {
    process.env.DATABASE_URL = "";
    mockSql.mockResolvedValue([]);

    const res = await GET(createRequest());
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBeDefined();
  });
});
