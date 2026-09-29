const { DateTime } = require("luxon");

module.exports = function (eleventyConfig) {
  // Copy static assets and the CMS admin folder straight through to output
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("admin");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("_redirects");

  // Collection of all scholarship/opportunity posts, newest deadline first is handled per-template;
  // here we just sort by publish date, most recent first.
  eleventyConfig.addCollection("posts", function (collectionApi) {
    return collectionApi.getFilteredByGlob("content/posts/*.md").sort((a, b) => {
      return b.date - a.date;
    });
  });

  eleventyConfig.addFilter("readableDate", (dateObj) => {
    if (!dateObj) return "";
    return DateTime.fromJSDate(new Date(dateObj), { zone: "utc" }).toFormat("dd LLL yyyy");
  });

  eleventyConfig.addFilter("daysLeft", (deadline) => {
    if (!deadline) return null;
    const today = DateTime.now().startOf("day");
    const end = DateTime.fromJSDate(new Date(deadline), { zone: "utc" }).startOf("day");
    const diff = Math.ceil(end.diff(today, "days").days);
    return diff;
  });

  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));
eleventyConfig.addFilter("rssDate", (dateObj) => { if (!dateObj) return ""; return DateTime.fromJSDate(new Date(dateObj), { zone: "utc" }).toRFC2822(); });
  eleventyConfig.addGlobalData("currentYear", () => new Date().getFullYear());

  return {
    dir: {
      input: ".",
      includes: "_includes",
      output: "_site",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"],
  };
};
