/**
 * 全 60×60 = 3,600 通りの解釈文を Gemini で事前生成して Supabase に投入。
 *
 * 使い方:
 *   GEMINI_API_KEY=xxx SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx \
 *     npx tsx scripts/generate-interpretations.ts
 *
 * 必要な依存（追加要）:
 *   npm install @google/genai @supabase/supabase-js zod tsx --save-dev
 */
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { STEMS, BRANCHES } from "../lib/bazi";
import { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE, RESPONSE_SCHEMA } from "./gemini-prompt";

const apiKey = process.env.GEMINI_API_KEY!;
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const VERSION = parseInt(process.env.VERSION || "1", 10);
const CONCURRENCY = 8;
const RETRY = 3;

if (!apiKey || !supabaseUrl || !supabaseKey) {
  console.error("環境変数 GEMINI_API_KEY / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY を設定してください");
  process.exit(1);
}

const genai = new GoogleGenAI({ apiKey });
const supabase = createClient(supabaseUrl, supabaseKey);

const ResponseShape = z.object({
  kichi: z.enum(["大吉", "中吉", "小吉", "末吉", "凶"]),
  score: z.number().int().min(0).max(100),
  headline: z.string().min(8).max(40),
  body: z.string().min(80).max(400),
  do_actions: z.array(z.string()).length(3),
  avoid_actions: z.array(z.string()).length(2),
  lucky_item: z.string(),
  lucky_color: z.string(),
  lucky_direction: z.string(),
  lucky_food: z.string(),
  lucky_sound: z.string(),
  lucky_number: z.string(),
});

type Pair = { user: string; target: string };

function allPairs(): Pair[] {
  const pillars: string[] = [];
  for (let i = 0; i < 60; i++) {
    pillars.push(`${STEMS[i % 10]}${BRANCHES[i % 12]}`);
  }
  const pairs: Pair[] = [];
  for (const u of pillars) for (const t of pillars) pairs.push({ user: u, target: t });
  return pairs;
}

async function generateOne(pair: Pair): Promise<unknown> {
  const res = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { role: "user", parts: [{ text: USER_PROMPT_TEMPLATE(pair.user, pair.target) }] },
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA as any,
    },
  });
  const text = res.text;
  if (!text) throw new Error("empty response");
  return JSON.parse(text);
}

async function generateWithRetry(pair: Pair): Promise<z.infer<typeof ResponseShape>> {
  let lastErr: unknown;
  for (let i = 0; i < RETRY; i++) {
    try {
      const raw = await generateOne(pair);
      return ResponseShape.parse(raw);
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastErr;
}

async function upsertInterpretation(pair: Pair, data: z.infer<typeof ResponseShape>) {
  const { error } = await supabase.from("interpretations").upsert({
    user_day_pillar: pair.user,
    target_day_pillar: pair.target,
    version: VERSION,
    kichi: data.kichi,
    score: data.score,
    headline: data.headline,
    body: data.body,
    do_actions: data.do_actions,
    avoid_actions: data.avoid_actions,
    lucky_item: data.lucky_item,
    lucky_color: data.lucky_color,
    lucky_direction: data.lucky_direction,
    lucky_food: data.lucky_food,
    lucky_sound: data.lucky_sound,
    lucky_number: data.lucky_number,
  }, { onConflict: "user_day_pillar,target_day_pillar,version" });
  if (error) throw error;
}

async function main() {
  const pairs = allPairs();
  console.log(`Total pairs: ${pairs.length}`);

  let done = 0, failed = 0;
  const queue = [...pairs];
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const pair = queue.shift();
      if (!pair) break;
      try {
        const data = await generateWithRetry(pair);
        await upsertInterpretation(pair, data);
        done++;
        if (done % 100 === 0) console.log(`[${done}/${pairs.length}] done`);
      } catch (e) {
        failed++;
        console.error(`Failed ${pair.user} × ${pair.target}:`, e);
      }
    }
  });
  await Promise.all(workers);
  console.log(`✅ Completed: ${done} success, ${failed} failed`);
}

main().catch((e) => { console.error(e); process.exit(1); });
