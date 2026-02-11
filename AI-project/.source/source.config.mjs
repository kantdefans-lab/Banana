// source.config.ts
import { defineDocs, defineConfig, defineCollections } from "fumadocs-mdx/config";
var docs = defineDocs({
  dir: "content/docs"
});
var pages = defineCollections({
  type: "doc",
  dir: "content/pages"
});
var posts = defineCollections({
  type: "doc",
  dir: "content/posts"
});
var source_config_default = defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      themes: {
        light: "github-light",
        dark: "github-dark"
      },
      // Use defaultLanguage for unknown language codes
      defaultLanguage: "plaintext"
    }
  }
});
export {
  source_config_default as default,
  docs,
  pages,
  posts
};
