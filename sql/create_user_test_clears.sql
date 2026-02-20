-- ユーザーのテストクリア状態を保存するテーブル
CREATE TABLE IF NOT EXISTS user_test_clears (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  test_type VARCHAR(20) NOT NULL, -- '4首', '8首', 'まとめ', '100首'
  range VARCHAR(20) NOT NULL, -- '1-4', '1-8', '1-16', 'all' など
  cleared_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, test_type, range)
);

-- インデックスを追加（クエリを高速化）
CREATE INDEX IF NOT EXISTS idx_user_test_clears_user_id ON user_test_clears(user_id);
CREATE INDEX IF NOT EXISTS idx_user_test_clears_user_range ON user_test_clears(user_id, range);

-- updated_atを自動更新するトリガー関数（オプション）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_test_clears_updated_at
  BEFORE UPDATE ON user_test_clears
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
