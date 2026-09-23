export async function postEverywhere(text, link) {
  const content = `${text}\n\n👉 ${link}`;
  const results = [];

  // 1. Telegram (Paling gampang & stabil)
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    try {
      const r = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          chat_id: process.env.TELEGRAM_CHAT_ID, 
          text: content,
          parse_mode: "HTML"
        }),
      }).then((res) => res.json());
      
      results.push({ 
        channel: "telegram", 
        ok: !!r.ok, 
        response: JSON.stringify(r).slice(0, 300) 
      });
    } catch (e) {
      results.push({ channel: "telegram", ok: false, response: e.message });
    }
  }

  // 2. Fallback Simulasi (Jika tidak ada API key yang diisi)
  if (results.length === 0) {
    results.push({ 
      channel: "simulasi", 
      ok: true, 
      response: "Mode simulasi aktif. Tambahkan TELEGRAM_BOT_TOKEN di Environment Variables Vercel untuk posting otomatis yang sebenarnya." 
    });
  }

  return results;
}
