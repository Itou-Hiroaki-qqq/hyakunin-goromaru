import { Howl, Howler } from "howler";

const DEFAULT_TIMEOUT_MS = 8000;

/**
 * 音声URLにキャッシュバスターを追加（R2の音声更新時にキャッシュを回避）
 * 環境変数 NEXT_PUBLIC_AUDIO_VERSION が設定されている場合はそれを使用、
 * なければ開発時はタイムスタンプ、本番時は空文字列
 */
function addCacheBuster(url: string): string {
  if (!url) return url;
  const version = process.env.NEXT_PUBLIC_AUDIO_VERSION;
  if (version) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}v=${version}`;
  }
  // 開発時はタイムスタンプでキャッシュ回避（本番では環境変数を使うことを推奨）
  if (process.env.NODE_ENV === "development") {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}_t=${Date.now()}`;
  }
  return url;
}

/** 再生中の音声をすべて停止（問題切り替え時の二重再生防止用） */
export function stopAll(): void {
  Howler.stop();
}

/**
 * 1つのURLを再生し、終了を Promise で返す。
 * 再生失敗（CORS等）やタイムアウト時も resolve し、学習が止まらないようにする。
 */
export function playOnce(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<void> {
  return new Promise((resolve) => {
    if (!url) {
      resolve();
      return;
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve();
    };

    const timer = setTimeout(finish, timeoutMs);

    const sound = new Howl({
      src: [addCacheBuster(url)],
      onend: finish,
      onloaderror: (_id, err) => {
        console.warn("音声の読み込みに失敗しました（CORS設定をご確認ください）:", url, err);
        finish();
      },
      onplayerror: () => finish(),
    });

    sound.once("loaderror", () => finish());
    sound.play();
  });
}

/**
 * 複数URLを順に再生
 */
export async function playSequence(urls: string[]): Promise<void> {
  for (const url of urls) {
    await playOnce(url);
  }
}
