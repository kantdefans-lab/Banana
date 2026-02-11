import { defineDocs, defineConfig, defineCollections } from 'fumadocs-mdx/config';

// 1. 文档集合 (对应文件夹 content/docs)
export const docs = defineDocs({
  dir: 'content/docs',
});

// 2. 页面集合 (对应文件夹 content/pages)
export const pages = defineCollections({
  type: 'doc',
  dir: 'content/pages',
});

// 3. 博客/文章集合 (对应文件夹 content/posts)
// ⚠️ 注意：这里配置的是 'content/posts'，请确保你的文件夹名也是 posts，而不是 blog
export const posts = defineCollections({
  type: 'doc',
  dir: 'content/posts',
});

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      // Use defaultLanguage for unknown language codes
      defaultLanguage: 'plaintext',
    },
  },
});