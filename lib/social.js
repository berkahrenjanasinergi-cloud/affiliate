export async function postEverywhere(text, link) {
  const content = `${text}\n\n👉 ${link}`;
  const results = [];

  // Telegram (paling gampang: buat bot di @BotFather, ambil token & chat id)
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    const r = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: content }),
      }
    ).then((r) => r.json()).catch((e) => ({ ok: false, description: e.message }));
    results.push({ channel: "telegram", ok: !!r.ok, response: JSON.stringify(r).slice(0, 300) });
  }

  // Facebook Page
  if (process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_TOKEN) {
    const r = await fetch(
      `https://graph.facebook.com/v19.0/${process.env.FACEBOOK_PAGE_ID}/feed`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, link, access_token: process.env.FACEBOOK_PAGE_TOKEN }),
      }
    ).then((r) => r.json()).catch((e) => ({ error: e.message }))}
