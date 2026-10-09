const { DateTime } = require("luxon");
const fs = require("fs");
const path = require("path");

/* ---------- helpers ---------- */
function ymd(v) {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v) ? null : v.toISOString().slice(0, 10);
  const m = String(v).match(/\d{4}-\d{2}-\d{2}/);
  return m ? m[0] : null;
}
function todayLagos() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}
function dayDiff(a, b) {
  const da = Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10));
  const db = Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10));
  return Math.round((db - da) / 86400000);
}
function asArray(v) {
  if (v === undefined || v === null || v === "") return [];
  return Array.isArray(v) ? v : [v];
}
function isExpired(item) {
  const d = ymd(item.data.deadline);
  return !!d && d < todayLagos();
}
function byDeadline(a, b) {
  const da = ymd(a.data.deadline), db = ymd(b.data.deadline);
  if (da && db) return da < db ? -1 : da > db ? 1 : a.data.title.localeCompare(b.data.title);
  if (da) return -1;
  if (db) return 1;
  return a.data.title.localeCompare(b.data.title);
}
function slugToken(s) {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/* ---------- "many at once" opportunities (read from _data/batch.json) ---------- */
function slugify(str) {
  return String(str || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
}
function batchItems() {
  let raw = {};
  try { raw = JSON.parse(fs.readFileSync(path.join(__dirname, "_data", "batch.json"), "utf8")); } catch (e) { raw = {}; }
  const posts = Array.isArray(raw.posts) ? raw.posts : [];
  const used = new Set();
  try {
    fs.readdirSync(path.join(__dirname, "content", "opportunities"))
      .filter((f) => f.endsWith(".md")).forEach((f) => used.add(f.replace(/\.md$/, "")));
  } catch (e) {}
  const today = new Date().toISOString().slice(0, 10);
  const out = [];
  posts.forEach((p) => {
    if (!p || !String(p.title || "").trim()) return;
    const base = slugify(p.slug) || slugify(p.title) || "opportunity";
    let slug = base, n = 2;
    while (used.has(slug)) slug = base + "-" + n++;
    used.add(slug);
    out.push({
      slug, title: String(p.title).trim(), category: String(p.category || "Scholarship"),
      level: asArray(p.level), date: ymd(p.date) || today, deadline: ymd(p.deadline),
      summary: String(p.summary || ""), link: String(p.link || ""), body: String(p.body || ""),
    });
  });
  return out;
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addGlobalData("batchOpportunities", () => batchItems());
  eleventyConfig.ignores.add("README.md");
  eleventyConfig.ignores.add("node_modules/**");
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("tools");
  eleventyConfig.addPassthroughCopy("robots.txt");

  /* ---------- collections ---------- */
  // One clean list of every opportunity, whether it came from a single
  // markdown file or from the "many at once" batch file.
  function allNormalized(api) {
    const fromFiles = api.getFilteredByGlob("content/opportunities/*.md").map((i) => ({
      url: i.url,
      fileSlug: i.fileSlug,
      date: i.date,
      data: {
        title: i.data.title,
        category: i.data.category || "",
        level: asArray(i.data.level),
        deadline: ymd(i.data.deadline),
        summary: i.data.summary || "",
        link: i.data.link || "",
        slug: i.fileSlug,
      },
    }));
    const fromBatch = batchItems().map((b) => ({
      url: `/opportunities/${b.slug}/`,
      fileSlug: b.slug,
      date: new Date(b.date + "T00:00:00Z"),
      data: {
        title: b.title, category: b.category, level: b.level,
        deadline: b.deadline, summary: b.summary, link: b.link, slug: b.slug,
      },
    }));
    return fromFiles.concat(fromBatch).filter((i) => i.data.title);
  }
  function orderOpps(list) {
    const open = list.filter((i) => !isExpired(i)).sort(byDeadline);
    const closed = list
      .filter((i) => isExpired(i))
      .sort((a, b) => (ymd(b.data.deadline) < ymd(a.data.deadline) ? -1 : ymd(b.data.deadline) > ymd(a.data.deadline) ? 1 : a.data.title.localeCompare(b.data.title)));
    return open.concat(closed);
  }
  // open ones by nearest deadline, expired ones last (most recently expired first)
  eleventyConfig.addCollection("opportunities", (api) => orderOpps(allNormalized(api)));
  eleventyConfig.addCollection("activeOpportunities", (api) =>
    allNormalized(api).filter((i) => !isExpired(i)).sort(byDeadline)
  );
  eleventyConfig.addCollection("opportunitiesNewestFirst", (api) =>
    allNormalized(api).sort((a, b) => b.date - a.date)
  );
  eleventyConfig.addCollection("materials", (api) =>
    api.getFilteredByGlob("content/materials/*.md").sort((a, b) => {
      const oa = Number(a.data.order ?? 100), ob = Number(b.data.order ?? 100);
      return oa - ob || a.data.title.localeCompare(b.data.title);
    })
  );
  eleventyConfig.addCollection("awards", (api) =>
    api.getFilteredByGlob("content/awards/*.md").sort((a, b) => b.date - a.date)
  );
  // plain objects used by client-side scripts (saved page, WhatsApp list)
  eleventyConfig.addCollection("opportunityIndex", (api) =>
    orderOpps(allNormalized(api)).map((i) => ({
      slug: i.fileSlug,
      title: i.data.title,
      url: i.url,
      category: i.data.category || "",
      levels: asArray(i.data.level),
      deadline: ymd(i.data.deadline),
      summary: i.data.summary || "",
    }))
  );

  /* ---------- filters ---------- */
  eleventyConfig.addFilter("asArray", asArray);
  eleventyConfig.addFilter("ymd", ymd);
  eleventyConfig.addFilter("lower", (s) => String(s || "").toLowerCase());
  eleventyConfig.addFilter("levelTokens", (arr) => asArray(arr).map(slugToken).join(" "));
  eleventyConfig.addFilter("readableDate", (v) => {
    const d = ymd(v);
    return d ? DateTime.fromISO(d, { zone: "utc" }).toFormat("dd LLL yyyy") : "";
  });
  eleventyConfig.addFilter("longDate", (v) => {
    const d = ymd(v);
    return d ? DateTime.fromISO(d, { zone: "utc" }).toFormat("d LLLL yyyy") : "";
  });
  eleventyConfig.addFilter("rssDate", (v) => {
    const d = ymd(v);
    return d ? DateTime.fromISO(d, { zone: "utc" }).toRFC2822() : "";
  });
  eleventyConfig.addFilter("daysLeft", (v) => {
    const d = ymd(v);
    return d ? dayDiff(todayLagos(), d) : null;
  });
  eleventyConfig.addFilter("isExpiredDate", (v) => {
    const d = ymd(v);
    return !!d && d < todayLagos();
  });
  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("relatedTo", (list, url, category, n) => {
    const others = (list || []).filter((i) => i.url !== url);
    const same = others.filter((i) => i.data.category === category);
    const rest = others.filter((i) => i.data.category !== category);
    return same.concat(rest).slice(0, n || 4);
  });
  eleventyConfig.addFilter("jsonify", (v) =>
    JSON.stringify(v).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")
  );
  eleventyConfig.addFilter("groupByType", (list) => {
    const groups = {};
    (list || []).forEach((i) => {
      const t = i.data.type || "Other";
      (groups[t] = groups[t] || []).push(i);
    });
    return Object.keys(groups).map((k) => ({ type: k, items: groups[k] }));
  });

  eleventyConfig.addGlobalData("currentYear", () => new Date().getFullYear());
  eleventyConfig.addGlobalData("buildDate", () => todayLagos());

  return {
    dir: { input: ".", includes: "_includes", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "11ty.js"],
  };
};
