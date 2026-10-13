// Creates one page per entry in _data/batchAwards.json
const markdownIt = require("markdown-it");
const md = markdownIt({ html: true, linkify: true, breaks: false });

module.exports = class {
  data() {
    return {
      pagination: { data: "batchAwardPages", size: 1, alias: "item" },
      permalink: (data) => `/award-notifications/${data.item.slug}/`,
      layout: "award.njk",
      eleventyExcludeFromCollections: true,
      eleventyComputed: {
        title: (d) => d.item.title,
        type: (d) => d.item.type,
        summary: (d) => d.item.summary,
        link: (d) => d.item.link,
        image: (d) => d.item.image,
        slug: (d) => d.item.slug,
        postedDate: (d) => d.item.date,
      },
    };
  }
  render(data) {
    return md.render(data.item.body || "");
  }
};
