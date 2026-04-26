-- ============================================================
-- 旭兆 (Asakizashi) 初期スキーマ
-- 対応する設計書: asakizashi-design.md v1.0 セクション1
-- ============================================================

-- ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- users
-- ============================================================
CREATE TABLE users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id         uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname        text NOT NULL CHECK (char_length(nickname) BETWEEN 1 AND 20),
  birth_date      date NOT NULL,
  birth_place     text NOT NULL,
  mbti            text CHECK (mbti IS NULL OR mbti ~ '^[EI][SN][TF][JP]$'),
  blood_type      text CHECK (blood_type IS NULL OR blood_type IN ('A','B','O','AB','unknown')),
  gender          text CHECK (gender IS NULL OR gender IN ('female','male','other','none')),
  wake_up_time    time NOT NULL DEFAULT '06:30',
  themes          text[] NOT NULL DEFAULT '{}' CHECK (array_length(themes, 1) IS NULL OR array_length(themes, 1) <= 3),
  year_pillar     text NOT NULL,
  month_pillar    text NOT NULL,
  day_pillar      text NOT NULL,
  deleted_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX users_day_pillar_idx ON users (day_pillar);

-- ============================================================
-- relations (つながり)
-- ============================================================
CREATE TABLE relations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  genre           text NOT NULL CHECK (genre IN ('person','oshi','work','key_day','pet','first_meet','past','place')),
  label           text NOT NULL,
  name            text NOT NULL,
  birth_date      date NOT NULL,
  birth_place     text,
  year_pillar     text NOT NULL,
  month_pillar    text NOT NULL,
  day_pillar      text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX relations_owner_idx ON relations (owner_user_id);

-- ============================================================
-- interpretations (Gemini事前生成解釈文)
-- ============================================================
CREATE TABLE interpretations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_day_pillar     text NOT NULL,
  target_day_pillar   text NOT NULL,
  kichi               text NOT NULL CHECK (kichi IN ('大吉','中吉','小吉','末吉','凶')),
  score               int NOT NULL CHECK (score BETWEEN 0 AND 100),
  headline            text NOT NULL,
  body                text NOT NULL,
  do_actions          text[] NOT NULL,
  avoid_actions       text[] NOT NULL,
  lucky_item          text NOT NULL,
  lucky_color         text NOT NULL,
  lucky_direction     text NOT NULL,
  lucky_food          text NOT NULL,
  lucky_sound         text NOT NULL,
  lucky_number        text NOT NULL,
  version             int NOT NULL DEFAULT 1,
  generated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_day_pillar, target_day_pillar, version)
);

CREATE INDEX interpretations_lookup_idx ON interpretations (user_day_pillar, target_day_pillar, version DESC);

-- ============================================================
-- daily_messages (ユーザーごとの当日確定メッセージ)
-- ============================================================
CREATE TABLE daily_messages (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_date                date NOT NULL,
  interpretation_id           uuid NOT NULL REFERENCES interpretations(id),
  rank                        int NOT NULL CHECK (rank BETWEEN 1 AND 12),
  tone_adjusted_headline      text NOT NULL,
  tone_adjusted_body          text NOT NULL,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, message_date)
);

CREATE INDEX daily_messages_user_date_idx ON daily_messages (user_id, message_date DESC);

-- ============================================================
-- journal_entries (振り返り日記)
-- ============================================================
CREATE TABLE journal_entries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_date      date NOT NULL,
  mood            int NOT NULL CHECK (mood BETWEEN 0 AND 3),
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, entry_date)
);

CREATE INDEX journal_entries_user_date_idx ON journal_entries (user_id, entry_date DESC);

-- ============================================================
-- subscriptions (Premium課金状態)
-- ============================================================
CREATE TABLE subscriptions (
  user_id                 uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  plan                    text NOT NULL CHECK (plan IN ('free','premium_monthly','premium_yearly')) DEFAULT 'free',
  status                  text NOT NULL CHECK (status IN ('active','expired','in_trial','cancelled','billing_issue')) DEFAULT 'active',
  started_at              timestamptz NOT NULL DEFAULT now(),
  expires_at              timestamptz,
  revenuecat_customer_id  text,
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- push_tokens (Expo Push Token)
-- ============================================================
CREATE TABLE push_tokens (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token           text NOT NULL UNIQUE,
  platform        text NOT NULL CHECK (platform IN ('ios','android')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_used_at    timestamptz
);

CREATE INDEX push_tokens_user_idx ON push_tokens (user_id);

-- ============================================================
-- updated_at 自動更新トリガー
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
