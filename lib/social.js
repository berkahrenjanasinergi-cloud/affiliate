export async function postEverywhere(text, link) {
  const content = `${text}\n\n👉 ${link}`;
  const results = [];

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  console.log("🔍 DEBUG - Bot Token:", botToken ? "ADA" : "TIDAK ADA");
  console.log("🔍 DEBUG - Chat ID:", chatId || "TIDAK ADA");

  if (botToken && chatId) {
    try {
      const r = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          chat_id: chatId, 
          text: content,
          parse_mode: "HTML"
        }),
      }).then((res) => res.json());
      
      if (r.ok) {
        results.push({ 
          channel: "telegram", 
          ok: true, 
          response: "Berhasil kirim ke Telegram!" 
        });
        console.log("✅ Telegram posting sukses!");
      } else {
        results.push({ 
          channel: "telegram", 
          ok: false, 
          response: `Error: ${r.description || JSON.stringify(r)}` 
        });
        console.log("❌ Telegram posting gagal:", r);
      }
    } catch (e) {
      results.push({ 
        channel: "telegram", 
        ok: false, 
        response: `Error: ${e.message}` 
      });
      console.log("❌ Telegram error:", e);
    }
  } else {
    console.log("️ Fallback ke simulasi karena env vars tidak lengkap");
  }

  if (results.length === 0) {
    results.push({ 
      channel: "simulasi", 
      ok: true, 
      response: "Mode simulasi aktif. Tambahkan TELEGRAM_BOT_TOKEN dan TELEGRAM_CHAT_ID di Vercel Environment Variables." 
    });
  }

  return results;
}
