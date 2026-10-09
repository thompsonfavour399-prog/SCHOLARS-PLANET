// Creates one page per entry in _data/batch.json
const markdownIt = require("markdown-it");
const md = markdownIt({ html: true, linkify: true, breaks: false });

module.exports = class {
  data() {
    return {
      pagination: { data: "batchOpportunities", size: 1, alias: "item" },
      permalink: (data) => `/opportunities/${data.item.slug}/`,
      layout: "post.njk",
      eleventyExcludeFromCollections: true,
      eleventyComputed: {
        title: (d) => d.item.title,
        category: (d) => d.item.category,
        level: (d) => d.item.level,
        deadline: (d) => d.item.deadline,
        summary: (d) => d.item.summary,
        link: (d) => d.item.link,
        slug: (d) => d.item.slug,
        postedDate: (d) => d.item.date,
      },
    };
  }
  render(data) {
    return md.render(data.item.body || "");
  }
};
