import { NextResponse } from "next/server";
import { supabaseAdmin, log } from "../../../lib/supabase";
import { postEverywhere } from "../../../lib/social";

export async function POST(req) {
  const { campaign_id } = await req.json();
  const sb = supabaseAdmin();

  const { data: camp } = await sb.from("campaigns").select("*, products(title, affiliate_url)").eq("id", campaign_id).single();
  if (!camp) return NextResponse.json({ ok: false, error: "Campaign tidak ada" }, { status: 404 });

  const results = await postEverywhere(`${camp.caption}\n\n${camp.hashtags}`, camp.products.affiliate_url);
  for (const r of results) {
    await sb.from("posts").insert({
      campaign_id: camp.id, channel: r.channel, content: camp.caption,
      status: r.ok ? "terkirim" : "gagal", response: r.response,
    });
  }
  await log(`🔁 Posting ulang "${camp.products.title}"`);
  return NextResponse.json({ ok: true, results });
}
