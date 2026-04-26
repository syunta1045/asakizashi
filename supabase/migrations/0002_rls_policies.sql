-- ============================================================
-- RLS (Row Level Security) ポリシー
-- 他ユーザーのデータに一切アクセスできないように保護
-- ============================================================

-- ============================================================
-- users
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own ON users FOR SELECT
  USING (auth.uid() = auth_id);

CREATE POLICY users_insert_own ON users FOR INSERT
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY users_update_own ON users FOR UPDATE
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

CREATE POLICY users_delete_own ON users FOR DELETE
  USING (auth.uid() = auth_id);

-- ============================================================
-- relations
-- ============================================================
ALTER TABLE relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY relations_owner_only ON relations FOR ALL
  USING (owner_user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()))
  WITH CHECK (owner_user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- ============================================================
-- interpretations (全員 SELECT 可、書き込みは service_role のみ)
-- ============================================================
ALTER TABLE interpretations ENABLE ROW LEVEL SECURITY;

CREATE POLICY interpretations_read_all ON interpretations FOR SELECT
  USING (true);

-- INSERT/UPDATE/DELETE はポリシー無し（= service_role のみ可能）

-- ============================================================
-- daily_messages
-- ============================================================
ALTER TABLE daily_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY daily_messages_self_read ON daily_messages FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- INSERT は Edge Function (service_role) のみ

-- ============================================================
-- journal_entries
-- ============================================================
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY journal_self_only ON journal_entries FOR ALL
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- ============================================================
-- subscriptions (本人 SELECT 可、INSERT/UPDATE は service_role)
-- ============================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscriptions_self_read ON subscriptions FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));

-- ============================================================
-- push_tokens
-- ============================================================
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY push_tokens_self_only ON push_tokens FOR ALL
  USING (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE auth_id = auth.uid()));
