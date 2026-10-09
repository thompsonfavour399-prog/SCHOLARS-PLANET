// Reads _data/batch.json (edited in /admin → "Opportunities: many at once")
// and turns every entry into a clean, safe opportunity object.
const fs = require("fs");
const path = require("path");

function ymd(v) {
  if (!v) return null;
  const m = String(v).match(/\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : null;
}
function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}
function asArray(v) {
  if (v === undefined || v === null || v === "") return [];
  return Array.isArray(v) ? v : [v];
}

module.exports = function () {
  let raw = {};
  try {
    raw = JSON.parse(fs.readFileSync(path.join(__dirname, "batch.json"), "utf8"));
  } catch (e) {
    raw = {};
  }
  const posts = Array.isArray(raw.posts) ? raw.posts : [];

  // URLs already taken by single-post markdown files (so two pages never clash)
  const used = new Set();
  try {
    fs.readdirSync(path.join(__dirname, "..", "content", "opportunities"))
      .filter((f) => f.endsWith(".md"))
      .forEach((f) => used.add(f.replace(/\.md$/, "")));
  } catch (e) {}

  const today = new Date().toISOString().slice(0, 10);
  const out = [];
  posts.forEach((p) => {
    if (!p || !String(p.title || "").trim()) return; // ignore empty entries
    const base = slugify(p.slug) || slugify(p.title) || "opportunity";
    let slug = base, n = 2;
    while (used.has(slug)) slug = base + "-" + n++;
    used.add(slug);
    out.push({
      slug,
      title: String(p.title).trim(),
      category: String(p.category || "Scholarship"),
      level: asArray(p.level),
      date: ymd(p.date) || today,
      deadline: ymd(p.deadline),
      summary: String(p.summary || ""),
      link: String(p.link || ""),
      body: String(p.body || ""),
    });
  });
  return out;
};
