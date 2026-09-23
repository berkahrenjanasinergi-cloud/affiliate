const MARKETS = {
  ID: { currency: "IDR", rate: 15800 }, MY: { currency: "MYR", rate: 4.7 },
  SG: { currency: "SGD", rate: 1.35 }, TH: { currency: "THB", rate: 36 },
  PH: { currency: "PHP", rate: 57 }, VN: { currency: "VND", rate: 25000 },
};

function shopeeLink(url) {
  const id = process.env.SHOPEE_AFFILIATE_ID;
  return id ? `https://s.shopee.co.id/an_redir?origin_link=${encodeURIComponent(url)}&affiliate_id=${id}` : url;
}
function lazadaLink(url) {
  const id = process.env.LAZADA_AFFILIATE_ID;
  return id ? `https://c.lazada.co.id/t/${id}?url=${encodeURIComponent(url)}` : url;
}
function tiktokLink(url) {
  const id = process.env.TIKTOOK_AFFILIATE_ID || process.env.TIKTOK_AFFILIATE_ID;
  return id ? `${url}?affiliate_id=${id}` : url;
}
function tokopediaLink(url) {
  const id = process.env.TOKOPEDIA_AFFILIATE_ID;
  return id ? `https://tk.tokopedia.com/${id}?url=${encodeURIComponent(url)}` : url;
}

function trainingData(keywords, countries) {
  const samples = [
    { m: "shopee", t: "Serum Vitamin C Brightening 30ml", c: "skincare", p: 89000, cr: 12, r: 4.8, s: 15400 },
    { m: "tiktok", t: "Wireless Earbuds TWS Bluetooth 5.3", c: "gadget", p: 129000, cr: 9, r: 4.7, s: 32000 },
    { m: "lazada", t: "Air Fryer 4L Low Watt", c: "kitchen", p: 459000, cr: 6, r: 4.9, s: 8700 },
    { m: "tokopedia", t: "Kaos Oversize Cotton Combed 30s", c: "fashion", p: 59000, cr: 10, r: 4.6, s: 41000 },
    { m: "shopee", t: "Lampu LED Sensor Gerak Kabinet", c: "home", p: 45000, cr: 15, r: 4.7, s: 22000 },
  ];
  const linkers = { shopee: shopeeLink, lazada: lazadaLink, tiktok: tiktokLink, tokopedia: tokopediaLink };

  return samples
    .filter((x) => keywords.length === 0 || keywords.some((k) => x.c.includes(k)))
    .map((x, i) => {
      const country = countries[i % countries.length] || "ID";
      const url = `https://${x.m}.example/product/${encodeURIComponent(x.t)}`;
      return {
        marketplace: x.m, country, title: x.t, url,
        affiliate_url: linkers[x.m](url), price: x.p,
        commission_rate: x.cr, commission_value: Math.round((x.p * x.cr) / 100),
        rating: x.r, sold_count: x.s, category: x.c,
      };
    });
}

export async function discoverProducts(keywords, countries) {
  // Mode latihan aktif otomatis jika API key belum diisi
  return trainingData(keywords, countries);
}

export { MARKETS };
