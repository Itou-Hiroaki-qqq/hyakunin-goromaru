/** 百人一首の1首（Neon poems テーブル想定） */
export interface Poem {
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
  /** DBによっては goro_kami_audio_url / kami_goro_audio_url のどちらか */
  kami_goro_audio_url?: string;
  shimo_goro_audio_url?: string;
  goro_kami_audio_url?: string;
  goro_shimo_audio_url?: string;
}
