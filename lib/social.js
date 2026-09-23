export async function postEverywhere(text, link) {
  const content = `${text}\n\n👉 ${link}`;
  const results = [];

  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    const r = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: content }),
    }).then((r) => r.json()).catch((e) => ({ ok: false, description: e.message }));
    results.push({ channel: "telegram", ok: !!r.ok, response: JSON.stringify(r).slice(0, 300) });
  }

  if (results.length === 0) {
    results.push({ channel: "simulasi", ok: true, response: "Mode simulasi: Isi TELEGRAM_BOT_TOKEN di .env untuk posting beneran." });
  }
  return results;
}
