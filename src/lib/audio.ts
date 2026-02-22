import { Howl, Howler } from "howler";

const DEFAULT_TIMEOUT_MS = 8000;

/** playOnce で作成した Howl を保持（読み込み中のものも stopAll で停止するため） */
const activeHowls = new Set<Howl>();

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

/** 再生中・読み込み中の音声をすべて停止（ページ離脱時も読み込み完了後の再生を防ぐ） */
export function stopAll(): void {
  Howler.stop();
  activeHowls.forEach((sound) => {
    try {
      sound.stop();
      sound.unload();
    } catch {
      // 既に unload 済みなどは無視
    }
  });
  activeHowls.clear();
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
      activeHowls.delete(sound);
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

    activeHowls.add(sound);
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
