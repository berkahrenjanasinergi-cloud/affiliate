import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase";

export async function POST(req) {
  const body = await req.json();
  const sb = supabaseAdmin();
  const rows = Object.entries(body).map(([key, value]) => ({ key, value: String(value) }));
  const { error } = await sb.from("settings").upsert(rows);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
