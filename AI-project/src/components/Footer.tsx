'use client';

import Link from 'next/link';

import { COOKIE_CONSENT_OPEN_EVENT } from '@/shared/constants/consent';

export default function Footer() {
  return (
    // ✅ mt-0: 彻底去掉外部顶部间距
    // ✅ border-t: 保留这 1 像素的分割线，颜色为深灰 border-gray-800
    <footer aria-labelledby="footer-heading" className="mt-0 border-t border-gray-800 bg-black text-white">
      {/* Toastify 容器 */}
      <section className="Toastify" aria-live="polite" aria-atomic="false" aria-relevant="additions text" aria-label="Notifications Alt+T"></section>
      
      {/* ✅ pt-0: 彻底去掉内部顶部内边距，让内容紧贴边框 */}
      <div className="mx-auto max-w-7xl px-6 py-4 pt-0">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          
          {/* 左侧：Logo 和 版权信息 */}
          <div className="space-y-4 md:w-80 md:flex-shrink-0 pt-6"> {/* 增加 pt-6 确保文字不紧贴边框 */}
            <Link className="flex items-center" href="/">
              <img className="h-8" alt="bananaimg.ai" src="/logo1.png" />
            </Link>
            <p className="max-w-3xl text-sm text-gray-400">
              Genea China Holdings Limited
            </p>
            <p className="mt-4 text-xs text-gray-500">
              ©&nbsp;2026&nbsp;Genea China Holdings Limited. All rights reserved.
            </p>
          </div>

          {/* 右侧：链接网格 */}
          <div className="grid grid-cols-2 gap-4 md:flex md:w-auto md:flex-row md:gap-12 pt-6"> {/* 增加 pt-6 保持对齐 */}
            {/* 占位列 */}
            <div>
              <ul role="list" className="space-y-4">
                <li>
                  <Link className="text-sm font-semibold leading-6 text-white" href="/"></Link>
                </li>
              </ul>
            </div>

            {/* Support 栏目 */}
            <div className="md:mt-0">
              <div className="text-sm font-semibold leading-6 text-white">Support</div>
              <ul role="list" className="mt-6 space-y-4">
                <li>
                  <Link className="text-sm leading-6 text-gray-400 hover:text-white transition-colors" href="/pricing/">
                    Pricing
                  </Link>
                </li>
                <li>
                  <a href="mailto:tony@pregorange.com" className="w-full cursor-pointer whitespace-normal text-wrap break-words text-sm leading-6 text-gray-400 hover:text-white transition-colors">
                    tony@pregorange.com
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal 栏目 */}
            <div className="md:mt-0">
              <div className="text-sm font-semibold leading-6 text-white">Legal</div>
              <ul role="list" className="mt-6 space-y-4">
                <li>
                  <Link className="text-sm leading-6 text-gray-400 hover:text-white transition-colors" href="/privacy-policy/">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() =>
                      window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_OPEN_EVENT))
                    }
                    className="text-sm leading-6 text-gray-400 hover:text-white transition-colors"
                  >
                    Cookie settings
                  </button>
                </li>
                <li>
                  <Link className="whitespace-nowrap text-sm leading-6 text-gray-400 hover:text-white transition-colors" href="/refund-policy/">
                    Refund Policy
                  </Link>
                </li>
                <li>
                  <Link className="whitespace-nowrap text-sm leading-6 text-gray-400 hover:text-white transition-colors" href="/terms-of-service/">
                    Terms &amp; Conditions
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      {/* 统计脚本已删除 */}
    </footer>
  );
}
