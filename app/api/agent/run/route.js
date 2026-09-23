import { NextResponse } from "next/server";
import { supabaseAdmin, log } from "@/lib/supabase";
import { discoverProducts } from "@/lib/sources";
import { analyze } from "@/lib/brain";
import { postEverywhere } from "@/lib/social";

async function runAgent() {
  const sb = supabaseAdmin();
  const dailyBudget = Number(process.env.DAILY_AD_BUDGET || 20);

  const { data: sRows } = await sb.from("settings").select("*");
  const s = Object.fromEntries((sRows || []).map((r) => [r.key, r.value]));
  const keywords = (s.keywords || "").split(",").map((k) => k.trim()).filter(Boolean);
  const countries = (s.countries || "ID").split(",").map((k) => k.trim()).filter(Boolean);
  const minCommission = Number(s.min_commission_rate || 5);
  const autoPost = (s.auto_post || "true") === "true";

  await log(`🔎 Mulai cari produk. Negara: ${countries.join(",")}`);

  const found = await discoverProducts(keywords, countries);
  await log(`📦 Ditemukan ${found.length} produk kandidat`);

  let promoted = 0;
  for (const p of found) {
    if (p.commission_rate < minCommission) continue;

    const { data: exist } = await sb.from("products").select("id").eq("url", p.url).maybeSingle();
    if (exist) continue;

    const a = await analyze(p, dailyBudget);

    const { data: prod } = await sb.from("products")
      .insert({ ...p, score: a.score, status: a.score >= 45 ? "dipromosikan" : "dibuang" })
      .select().single();

    await log(`🧠 "${p.title}" → skor ${a.score} → ${a.platform}`);
    if (a.score < 45) continue;

    const { data: camp } = await sb.from("campaigns")
      .insert({
        product_id: prod.id, platform: a.platform, daily_budget: a.daily_budget,
        duration_days: a.duration_days, target_audience: a.target_audience,
        hook: a.hook, caption: a.caption, hashtags: a.hashtags,
        reasoning: a.reasoning, expected_roi: a.expected_roi, status: "aktif",
      }).select().single();

    if (autoPost && camp) {
      const results = await postEverywhere(`${a.caption}\n\n${a.hashtags}`, p.affiliate_url);
      for (const r of results) {
        await sb.from("posts").insert({
          campaign_id: camp.id, channel: r.channel, content: a.caption,
          status: r.ok ? "terkirim" : "gagal", response: r.response,
        });
      }
      await log(`📤 Posting "${p.title}" ke ${results.map((r) => r.channel).join(", ")}`);
    }
    promoted++;
  }

  await log(`✅ Selesai. ${promoted} produk dipromosikan.`);
  return { found: found.length, promoted };
}

export async function POST() {
  try {
    const r = await runAgent();
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    await log(`❌ Error: ${e.message}`, "error");
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
