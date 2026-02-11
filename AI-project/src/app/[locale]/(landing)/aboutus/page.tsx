import { Building2, MapPin, Mail, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 flex flex-col items-center justify-center relative overflow-hidden">
      {/* 背景光效 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-2xl z-10">
        {/* 返回按钮 */}
        <Link 
          href="/" 
          className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-8 group"
        >
          <ChevronLeft className="h-4 w-4 mr-1 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        {/* 标题 */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500 mb-4">
            About Us
          </h1>
          <p className="text-gray-400 text-lg">
            Contact information and company details.
          </p>
        </div>

        {/* 信息卡片 */}
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          <div className="space-y-8">
            
            {/* 1. 公司名称 */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-lg shrink-0">
                <Building2 className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Company Name</h3>
                <p className="text-lg font-semibold text-white leading-relaxed">
                  Genea China Holdings Limited <br />
                  <span className="text-gray-300 font-normal">珍爱儿中国控股有限公司</span>
                </p>
              </div>
            </div>

            {/* 分割线 */}
            <div className="h-px bg-gray-800/50 w-full my-4"></div>

            {/* 2. 地址 */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg shrink-0">
                <MapPin className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Address</h3>
                <p className="text-lg text-white leading-relaxed">
                  FLAT/RM 204-5STAG BUILDING 2/F <br />
                  148-150 QUEEN'S ROAD CENTRAL <br />
                  HK
                </p>
              </div>
            </div>

            {/* 分割线 */}
            <div className="h-px bg-gray-800/50 w-full my-4"></div>

            {/* 3. 邮箱 */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg shrink-0">
                <Mail className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">E-mail</h3>
                <a 
                  href="mailto:tony@pregorange.com" 
                  className="text-lg text-white hover:text-yellow-400 transition-colors underline underline-offset-4"
                >
                  tony@pregorange.com
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* 底部版权 */}
        <div className="mt-12 text-center text-sm text-gray-600">
          © 2026 Genea China Holdings Limited. All rights reserved.
        </div>
      </div>
    </div>
  );
}