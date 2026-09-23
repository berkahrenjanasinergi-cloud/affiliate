export async function postEverywhere(text, link) {
  const content = `${text}\n\n👉 ${link}`;
  const results = [];

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  console.log("🔍 [DEBUG] Bot Token:", botToken ? `ADA (${botToken.length} chars)` : "TIDAK ADA");
  console.log(" [DEBUG] Chat ID:", chatId || "TIDAK ADA");

  if (botToken && chatId) {
    try {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      console.log("🔍 [DEBUG] URL:", url);
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          chat_id: chatId, 
          text: content,
          parse_mode: "HTML"
        }),
      });

      const data = await response.json();
      console.log("🔍 [DEBUG] Telegram Response:", JSON.stringify(data));

      if (data.ok) {
        results.push({ 
          channel: "telegram", 
          ok: true, 
          response: "Sukses terkirim ke Telegram!" 
        });
        console.log("✅ [SUCCESS] Posting ke Telegram berhasil!");
      } else {
        results.push({ 
          channel: "telegram", 
          ok: false, 
          response: `Telegram Error: ${data.description || JSON.stringify(data)}` 
        });
        console.log("❌ [ERROR] Telegram posting gagal:", data);
      }
    } catch (e) {
      results.push({ 
        channel: "telegram", 
        ok: false, 
        response: `Fetch Error: ${e.message}` 
      });
      console.log("❌ [EXCEPTION] Telegram error:", e);
    }
  } else {
    console.log("⚠️ [FALLBACK] Env vars tidak lengkap, pakai simulasi");
  }

  if (results.length === 0) {
    results.push({ 
      channel: "simulasi", 
      ok: true, 
      response: "Mode simulasi aktif." 
    });
  }

  return results;
}
