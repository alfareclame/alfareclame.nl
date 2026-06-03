// Eleventy config — Alfa Reclame Rotterdam
// Input = repo root, output = _site/. Page templates are *.njk; everything
// else (static assets, CF Pages config, SEO files, Functions) is copied
// through verbatim so the deployed _site/ matches the current live site.
const { EleventyRenderPlugin } = require("@11ty/eleventy");
const { execSync } = require("child_process");

module.exports = function (eleventyConfig) {
  // Enables `| renderContent("njk")` filter so frontmatter strings
  // (e.g. inline JSON-LD) can re-expand {{ site.var }} references.
  eleventyConfig.addPlugin(EleventyRenderPlugin);

  // Returns the ISO-8601 date of the last git commit that touched a given
  // source file. Falls back to the current date when git history is unavailable
  // (shallow clone in CI, new file, or non-git environment).
  eleventyConfig.addFilter("gitLastModified", (filePath) => {
    try {
      const cwd = process.cwd();
      const out = execSync(`git log -1 --format=%cI -- "${filePath}"`, {
        cwd,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
      return out || new Date().toISOString();
    } catch {
      return new Date().toISOString();
    }
  });

  // Static assets + CF Pages files — passthrough-copied to _site/ root.
  const passthrough = [
    "public",
    "functions",
    "data",
    "_redirects",
    "_headers",
    "_routes.json",
    "sitemap.xml",
    "sitemap-image.xml",
    "sitemap-index.xml",
    "sitemap-stories.xml",
    "stories",
    "robots.txt",
    "llms.txt",
    "humans.txt",
    "manifest.json",
    "imgs-manifest.json",
    "c80c952b77275971494670c168fd7c7e5b2affa21d357bba74042b4082dd768d.txt",
    "google26dfc393f11fd085.html",
    ".well-known",
    "service-worker.js",
  ];
  for (const path of passthrough) {
    eleventyConfig.addPassthroughCopy(path);
  }

  // Google Search Console verification file — passthrough-copy only, never
  // process as a template (must stay at exact /google...html URL).
  eleventyConfig.ignores.add("google26dfc393f11fd085.html");

  // Only treat .njk and .html as templates — never process stray .md files
  // (README.md, .github/*.md, public/images/**/README.md).
  eleventyConfig.setTemplateFormats(["njk", "html"]);

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
