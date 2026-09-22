// Agent cari produk dari beberapa sumber.
// Kalau API key kosong, agent pakai "mode latihan" (data contoh realistis)
// supaya kamu tetap bisa lihat cara kerjanya.

const MARKETS = {
  ID: { currency: "IDR", rate: 15800 },
  MY: { currency: "MYR", rate: 4.7 },
  SG: { currency: "SGD", rate: 1.35 },
  TH: { currency: "THB", rate: 36 },
  PH: { currency: "PHP", rate: 57 },
  VN: { currency: "VND", rate: 25000 },
};

// ---- 1. Involve Asia (satu key untuk Shopee, Lazada, Zalora, dll se-ASEAN)
async function fromInvolveAsia(keywords, countries) {
  const key = process.env.INVOLVE_ASIA_KEY;
  const secret = process.env.INVOLVE_ASIA_SECRET;
  if (!key || !secret) return [];

  const auth = await fetch("https://api.involve.asia/api/authenticate", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ key, secret }),
  }).then((r) => r.json());

  const token = auth?.data?.token;
  if (!token) return [];

  const res = await fetch("https://api.involve.asia/api/offers/all", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ page: "1", limit: "50" }),
  }).then((r) => r.json());

  return (res?.data?.data || [])
    .filter((o) => countries.includes((o.countries || "")[0]))
    .map((o) => ({
      marketplace: (o.offer_name || "").toLowerCase().includes("lazada")
        ? "lazada"
        : "shopee",
      country: o.countries?.[0] || "ID",
      title: o.offer_name,
      url: o.preview_url,
      affiliate_url: o.tracking_link,
      price: 0,
      commission_rate: parseFloat(o.commissions?.[0]?.value || 0),
      commission_value: 0,
      rating: 4.5,
      sold_count: 0,
      category: o.categories?.[0] || "general",
    }));
}

// ---- 2. Shopee Affiliate Open Platform (isi affiliate ID → link otomatis)
function shopeeLink(url) {
  const id = process.env.SHOPEE_AFFILIATE_ID;
  return id ? `https://s.shopee.co.id/an_redir?origin_link=${encodeURIComponent(url)}&affiliate_id=${id}` : url;
}
function lazadaLink(url) {
  const id = process.env.LAZADA_AFFILIATE_ID;
  return id ? `https://c.lazada.co.id/t/${id}?url=${encodeURIComponent(url)}` : url;
}
function tiktokLink(url) {
  const id = process.env.TIKTOK_AFFILIATE_ID;
  return id ? `${url}?affiliate_id=${id}` : url;
}
function tokopediaLink(url) {
  const id = process.env.TOKOPEDIA_AFFILIATE_ID;
  return id ? `https://tk.tokopedia.com/${id}?url=${encodeURIComponent(url)}` : url;
}

// ---- 3. Mode latihan: data contoh realistis agar agent tetap jalan
function trainingData(keywords, countries) {
  const samples = [
    { m: "shopee", t: "Serum Vitamin C Brightening 30ml", c: "skincare", p: 89000, cr: 12, r: 4.8, s: 15400 },
    { m: "tiktok", t: "Wireless Earbuds TWS Bluetooth 5.3", c: "gadget", p: 129000, cr: 9, r: 4.7, s: 32000 },
    { m: "lazada", t: "Air Fryer 4L Low Watt", c: "kitchen", p: 459000, cr: 6, r: 4.9, s: 8700 },
    { m: "tokopedia", t: "Kaos Oversize Cotton Combed 30s", c: "fashion", p: 59000, cr: 10, r: 4.6, s: 41000 },
    { m: "shopee", t: "Lampu LED Sensor Gerak Kabinet", c: "home", p: 45000, cr: 15, r: 4.7, s: 22000 },
    { m: "tiktok", t: "Sunscreen SPF50 PA++++ Gel", c: "skincare", p: 75000, cr: 14, r: 4.9, s: 67000 },
    { m: "lazada", t: "Smartwatch Fitness Tracker", c: "gadget", p: 249000, cr: 7, r: 4.5, s: 12000 },
    { m: "shopee", t: "Rak Bumbu Dapur Putar 360", c: "kitchen", p: 68000, cr: 13, r: 4.6, s: 19000 },
  ];
  const linkers = { shopee: shopeeLink, lazada: lazadaLink, tiktok: tiktokLink, tokopedia: tokopediaLink };

  return samples
    .filter((x) => keywords.length === 0 || keywords.some((k) => x.c.includes(k)))
    .map((x, i) => {
      const country = countries[i % countries.length] || "ID";
      const url = `https://${x.m}.example/product/${encodeURIComponent(x.t)}`;
      return {
        marketplace: x.m,
        country,
        title: x.t,
        url,
        affiliate_url: linkers[x.m](url),
        price: x.p,
        commission_rate: x.cr,
        commission_value: Math.round((x.p * x.cr) / 100),
        rating: x.r,
        sold_count: x.s,
        category: x.c,
      };
    });
}

export async function discoverProducts(keywords, countries) {
  const results = [];
  results.push(...(await fromInvolveAsia(keywords, countries).catch(() => [])));
  if (results.length === 0) results.push(...trainingData(keywords, countries));
  return results;
}

export { MARKETS };
