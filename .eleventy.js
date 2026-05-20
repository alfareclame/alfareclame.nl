// Eleventy config — Alfa Reclame Rotterdam
// Input = repo root, output = _site/. Page templates are *.njk; everything
// else (static assets, CF Pages config, SEO files, Functions) is copied
// through verbatim so the deployed _site/ matches the current live site.
module.exports = function (eleventyConfig) {
  // Static assets + CF Pages files — passthrough-copied to _site/ root.
  const passthrough = [
    "public",
    "functions",
    "data",
    "_redirects",
    "_headers",
    "_routes.json",
    "sitemap.xml",
    "robots.txt",
    "llms.txt",
    "humans.txt",
    "manifest.json",
    "imgs-manifest.json",
    "c80c952b77275971494670c168fd7c7e5b2affa21d357bba74042b4082dd768d.txt",
  ];
  for (const path of passthrough) {
    eleventyConfig.addPassthroughCopy(path);
  }

  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: false,
  };
};
