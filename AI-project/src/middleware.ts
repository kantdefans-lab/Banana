import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // 1. 支持的语言列表
  // (必须和你项目中实际支持的语言一致，根据之前的日志看是 en 和 zh)
  locales: ['en', 'zh'],
 
  // 2. 默认语言
  // (如果用户浏览器语言无法识别，默认去哪里？这里设为英文)
  defaultLocale: 'en',

  // 3. 总是显示语言前缀
  // (开启这个，访问 / 会自动跳到 /en；访问 /about 会跳到 /en/about)
  localePrefix: 'always'
});

export const config = {
  // 4. 路由匹配规则 (Matcher)
  // 这一行非常重要！它告诉 Next.js：
  // "除了 api 接口、_next 系统文件、图片等静态资源外，其他所有路径都要经过我处理"
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};