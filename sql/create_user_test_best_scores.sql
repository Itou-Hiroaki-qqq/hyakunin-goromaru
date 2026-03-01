-- ユーザーの「最高一発正解数」を保存するテーブル（Neon で永続化）
CREATE TABLE IF NOT EXISTS user_test_best_scores (
  user_id UUID NOT NULL,
  test_key VARCHAR(64) NOT NULL,   -- 例: 'range:17-20', '100首:all', 'tricky_kami:summary'
  best_score INTEGER NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, test_key)
);

CREATE INDEX IF NOT EXISTS idx_user_test_best_scores_user_id ON user_test_best_scores(user_id);
