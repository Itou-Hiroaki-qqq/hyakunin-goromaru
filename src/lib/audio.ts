import { Howl, Howler } from "howler";

const DEFAULT_TIMEOUT_MS = 8000;

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
      src: [url],
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
