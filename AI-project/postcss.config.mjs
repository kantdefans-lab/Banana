/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // ❌ 之前报错是因为这里写成了 '@tailwindcss/postcss'
    // ✅ 改回 v3 的写法：
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;