function ruleBasedAnalysis(p, dailyBudget) {
  const commissionScore = Math.min(p.commission_rate * 4, 40);
  const demandScore = Math.min(Math.log10(p.sold_count + 1) * 8, 30);
  const trustScore = Math.min((p.rating - 3) * 15, 30);
  const score = Math.round(commissionScore + demandScore + trustScore);

  let platform = "meta_ads";
  if (["skincare", "fashion", "gadget"].includes(p.category)) platform = "tiktok_ads";
  if (p.price > 400000) platform = "google_ads";
  if (score < 45) platform = "organic";

  const budgetShare = score >= 80 ? 0.4 : score >= 65 ? 0.25 : score >= 45 ? 0.1 : 0;
  const daily_budget = Math.round(dailyBudget * budgetShare * 100) / 100;

  const hooks = {
    skincare: `Kulit glowing dalam 7 hari? Ini rahasianya 👇`,
    gadget: `Harga segini, kualitasnya bikin kaget 😱`,
    fashion: `Outfit ini lagi viral, stok tinggal sedikit!`,
    kitchen: `Masak jadi 2x lebih cepat pakai ini 🍳`,
    home: `Rumah rapi otomatis, cuma modal ini`,
  };

  return {
    score, platform, daily_budget, duration_days: score >= 65 ? 7 : 3,
    target_audience: `${p.country} · usia 18-35 · minat ${p.category}`,
    hook: hooks[p.category] || `Produk ${p.category} terlaris minggu ini!`,
    caption: `${hooks[p.category] || ""}\n\n${p.title}\n⭐ ${p.rating} · ${p.sold_count.toLocaleString()} terjual\n💰 Cek harga promo di link!`,
    hashtags: `#${p.category} #racun${p.marketplace} #viral #fyp #${p.country.toLowerCase()}`,
    reasoning: `Komisi ${p.commission_rate}% (skor ${Math.round(commissionScore)}), terjual ${p.sold_count} (skor ${Math.round(demandScore)}), rating ${p.rating} (skor ${Math.round(trustScore)}). Total ${score}/100 → ${platform}, budget ${daily_budget} USD/hari.`,
    expected_roi: Math.round((score / 100) * 3 * 100) / 100,
  };
}

async function openAiAnalysis(p, dailyBudget) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: `Analisa produk affiliate ini dan balas HANYA JSON: ${JSON.stringify(p)}. Budget harian: ${dailyBudget} USD.` }],
        response_format: { type: "json_object" },
        temperature: 0.4,
      }),
    }).then((r) => r.json());
    return JSON.parse(res.choices[0].message.content);
  } catch {
    return null;
  }
}

export async function analyze(product, dailyBudget) {
  const ai = await openAiAnalysis(product, dailyBudget).catch(() => null);
  return ai || ruleBasedAnalysis(product, dailyBudget);
}
