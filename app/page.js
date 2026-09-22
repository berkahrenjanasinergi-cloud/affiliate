"use client";
import { useEffect, useState } from "react";
import { supabaseClient } from "../lib/supabase";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [posts, setPosts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [settings, setSettings] = useState({ keywords: "", countries: "", min_commission_rate: "5" });

  const sb = supabaseClient();

  async function loadAll() {
    const [p, c, po, l, s] = await Promise.all([
      sb.from("products").select("*").order("score", { ascending: false }).limit(30),
      sb.from("campaigns").select("*, products(title, marketplace, country, affiliate_url)").order("created_at", { ascending: false }).limit(20),
      sb.from("posts").select("*").order("created_at", { ascending: false }).limit(20),
      sb.from("agent_logs").select("*").order("created_at", { ascending: false }).limit(30),
      sb.from("settings").select("*"),
    ]);
    setProducts(p.data || []);
    setCampaigns(c.data || []);
    setPosts(po.data || []);
    setLogs(l.data || []);
    if (s.data) {
      const obj = {};
      s.data.forEach((r) => (obj[r.key] = r.value));
      setSettings((prev) => ({ ...prev, ...obj }));
    }
  }

  useEffect(() => {
    loadAll();
    // REALTIME: tiap ada data baru, dashboard refresh sendiri
    const ch = sb
      .channel("dashboard")
      .on("postgres_changes", { event: "*", schema: "public" }, () => loadAll())
      .subscribe();
    return () => sb.removeChannel(ch);
    // eslint-disable-next-line
  }, []);

  async function runAgent() {
    setRunning(true);
    await fetch("/api/agent/run", { method: "POST" });
    setRunning(false);
    loadAll();
  }

  async function saveSettings() {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    alert("Tersimpan ✅");
  }

  async function repost(campaign_id) {
    await fetch("/api/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaign_id }),
    });
  }

  const totalBudget = campaigns.reduce((a, c) => a + Number(c.daily_budget || 0), 0);
  const badge = (s) => (s >= 65 ? "hi" : s >= 45 ? "mid" : "lo");

  return (
    <div className="wrap">
      <h1>🤖 Affily Agent</h1>
      <p className="sub">AI cari produk komisi besar → analisa → atur budget iklan → auto posting. Realtime.</p>

      <button className="bigbtn" onClick={runAgent} disabled={running}>
        {running ? "⏳ Agent sedang kerja..." : "🚀 Jalankan Agent"}
      </button>

      <div className="grid">
        <div className="stat"><b>{products.length}</b><span>Produk ditemukan</span></div>
        <div className="stat"><b>{products.filter((p) => p.score >= 65).length}</b><span>Produk potensial</span></div>
        <div className="stat"><b>{campaigns.length}</b><span>Campaign</span></div>
        <div className="stat"><b>${totalBudget.toFixed(2)}</b><span>Budget iklan/hari</span></div>
        <div className="stat"><b>{posts.filter((p) => p.status === "terkirim").length}</b><span>Posting terkirim</span></div>
      </div>

      <div className="card">
        <h2>⚙️ Pengaturan (opsional)</h2>
        <div className="row">
          <input placeholder="Kata kunci: skincare,gadget,fashion" value={settings.keywords}
            onChange={(e) => setSettings({ ...settings, keywords: e.target.value })} />
          <input placeholder="Negara: ID,MY,SG,TH,PH,VN" value={settings.countries}
            onChange={(e) => setSettings({ ...settings, countries: e.target.value })} />
          <input placeholder="Min komisi %" value={settings.min_commission_rate}
            onChange={(e) => setSettings({ ...settings, min_commission_rate: e.target.value })} />
          <button className="mini" onClick={saveSettings}>Simpan</button>
        </div>
      </div>

      <div className="card">
        <h2>🏆 Produk Potensial (urut skor)</h2>
        <table>
          <thead><tr><th>Skor</th><th>Produk</th><th>Toko</th><th>Komisi</th><th>Terjual</th><th>Link</th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td><span className={`badge ${badge(p.score)}`}>{p.score}</span></td>
                <td>{p.title}<br /><span className="small">{p.category} · ⭐{p.rating}</span></td>
                <td>{p.marketplace} {p.country}</td>
                <td>{p.commission_rate}%</td>
                <td>{Number(p.sold_count).toLocaleString()}</td>
                <td><a href={p.affiliate_url} target="_blank" rel="noreferrer">Buka</a></td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={6} className="small">Belum ada. Tekan tombol 🚀 di atas.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>📢 Strategi Iklan & Campaign</h2>
        <table>
          <thead><tr><th>Produk</th><th>Iklan di</th><th>Budget/hari</th><th>Durasi</th><th>Target</th><th>Alasan AI</th><th></th></tr></thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id}>
                <td>{c.products?.title}</td>
                <td><b>{c.platform}</b></td>
                <td>${c.daily_budget}</td>
                <td>{c.duration_days} hari</td>
                <td className="small">{c.target_audience}</td>
                <td className="small">{c.reasoning}<br /><i>Hook: {c.hook}</i></td>
                <td><button className="mini" onClick={() => repost(c.id)}>Posting</button></td>
              </tr>
            ))}
            {campaigns.length === 0 && <tr><td colSpan={7} className="small">Belum ada campaign.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>📤 Riwayat Posting Sosmed</h2>
        <table>
          <thead><tr><th>Waktu</th><th>Channel</th><th>Status</th><th>Isi</th></tr></thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id}>
                <td className="small">{new Date(p.created_at).toLocaleString("id-ID")}</td>
                <td>{p.channel}</td>
                <td><span className={`badge ${p.status === "terkirim" ? "hi" : "lo"}`}>{p.status}</span></td>
                <td className="small">{(p.content || "").slice(0, 100)}...</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>📜 Log Agent (live)</h2>
        {logs.map((l) => (
          <div key={l.id} className={`log ${l.level}`}>
            [{new Date(l.created_at).toLocaleTimeString("id-ID")}] {l.message}
          </div>
        ))}
      </div>
    </div>
  );
}
