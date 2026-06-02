// Directory data for /pl/ — Polish pages.
// Broken/implausible multilingual targeting (no reciprocal nl hreflang, near-zero
// Polish-language local-signage search demand). Kept live (real content, internal
// link value) but removed from the index to free crawl budget for the Dutch pages.
// eleventyComputed overrides each page's frontmatter `robots`.
module.exports = {
  eleventyComputed: {
    robots: () => "noindex, follow, max-image-preview:large",
  },
};
