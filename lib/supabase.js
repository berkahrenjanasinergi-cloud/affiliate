import { createClient } from "@supabase/supabase-js";

export const supabaseClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );

export const supabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );

export async function log(message, level = "info") {
  try {
    await supabaseAdmin().from("agent_logs").insert({ message, level });
  } catch (e) {
    console.error("Gagal log:", e.message);
  }
}
