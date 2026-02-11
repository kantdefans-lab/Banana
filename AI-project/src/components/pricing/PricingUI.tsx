'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react'; // 🔥 修改 1：引入 ArrowLeft
import Link from 'next/link';

interface PricingUIProps {
  user: any;
  currentSubscription: any;
}

export default function PricingUI({ user, currentSubscription }: PricingUIProps) {
  // 默认选为年付
  const [isYearly, setIsYearly] = useState(true); 
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  
  // 管理协议勾选状态
  const [agreements, setAgreements] = useState<Record<string, boolean>>({
    basic: false,
    standard: false,
    pro: false,
  });

  const router = useRouter();

  // ID 配置
  const PLAN_CONFIG: Record<string, { monthly: string; yearly: string }> = {
    basic: {
      monthly: 'starter-monthly', 
      yearly:  'starter-yearly',  
    },
    standard: {
      monthly: 'standard-monthly',
      yearly:  'standard-yearly',
    },
    pro: {
      monthly: 'premium-monthly',
      yearly:  'premium-yearly',
    }
  };

  // 价格配置
  const pricingData = {
    basic: {
      yearlyPrice: 8.3,
      yearlyTotal: 100,
      credits: '2,400',
      imgs: '600',
      videos: '192',
    },
    standard: { 
      monthlyPrice: 29.9,
      yearlyPrice: 24.0,
      yearlyTotal: 288,
      credits: isYearly ? '9,600' : '800',
      imgs: isYearly ? '2,400' : '200',
      videos: isYearly ? '960' : '80',
    },
    pro: {
      monthlyPrice: 49.9,
      yearlyPrice: 30.0,
      yearlyTotal: 360,
      credits: isYearly ? '21,600' : '1,800',
      imgs: isYearly ? '5,400' : '450',
      videos: isYearly ? '2,160' : '180',
    }
  };

  // 切换勾选状态
  const toggleAgreement = (planKey: string) => {
    setAgreements(prev => ({ ...prev, [planKey]: !prev[planKey] }));
  };

  const handleCheckout = async (planKey: string) => {
    if (!agreements[planKey]) {
      alert('Please read and agree to the Auto-Renewal Agreement, Membership Agreement, and Refund Policy to proceed.');
      return;
    }

    if (!user) {
      router.push('/sign-in?redirect=/pricing');
      return;
    }

    setLoadingPlan(planKey);

    const intervalKey = isYearly ? 'yearly' : 'monthly';
    const productId = PLAN_CONFIG[planKey]?.[intervalKey];

    if (!productId) {
      alert(`Error: Product ID for ${planKey} (${intervalKey}) not found.`);
      setLoadingPlan(null);
      return;
    }

    try {
      const response = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId, 
          interval: isYearly ? 'year' : 'month',
        }),
      });

      const result = await response.json();

      if (result.code === 0 && result.data?.checkoutUrl) {
        window.location.href = result.data.checkoutUrl;
      } else if (result.url) {
        window.location.href = result.url;
      } else {
        console.error('Payment Error:', result);
        alert(result.message || 'Failed to initiate checkout');
        setLoadingPlan(null);
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Network error, please try again.');
      setLoadingPlan(null);
    }
  };

  // 动态网格样式
  const gridColsClass = isYearly 
    ? 'lg:grid-cols-4 md:grid-cols-2' 
    : 'lg:grid-cols-3 md:grid-cols-2';

  // 📝 封装协议复选框组件
  const AgreementCheckbox = ({ planKey }: { planKey: string }) => (
    <div className="mt-4 flex items-start gap-2 text-xs text-gray-400 min-h-[40px]">
      <input
        type="checkbox"
        id={`agree-${planKey}`}
        checked={agreements[planKey]}
        onChange={() => toggleAgreement(planKey)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-zinc-600 bg-zinc-800 text-yellow-400 focus:ring-yellow-400 focus:ring-offset-zinc-900"
      />
      <label htmlFor={`agree-${planKey}`} className="cursor-pointer select-none leading-tight">
        I agree to the{' '}
        <Link href="/auto-renewal-agreement" target="_blank" className="text-yellow-400 hover:underline">
          Auto-Renewal
        </Link>
        ,{' '}
        <Link href="/membership-agreement" target="_blank" className="text-yellow-400 hover:underline">
          Membership
        </Link>
        {' '}and{' '}
        <Link href="/refund-policy" target="_blank" className="text-yellow-400 hover:underline">
          Refund Policy
        </Link>.
      </label>
    </div>
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-black text-white">
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <section>
          <div className="mx-auto w-[99%] px-4 py-12 sm:px-6 md:w-[90%] md:min-w-[1400px] lg:px-8 2xl:w-[75%]">
            
            {/* 🔥 修改 2：Back to Home 按钮 */}
            <div className="w-full flex justify-start mb-8">
              <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group px-4 py-2 rounded-lg hover:bg-zinc-900">
                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                <span className="font-medium">Back to Home</span>
              </Link>
            </div>

            <div className="flex flex-col items-center justify-start">
              
              {/* Header Title */}
              <div className="mx-auto mb-10 flex max-w-3xl flex-col items-center text-center">
                <h1 className="text-4xl font-bold tracking-tight text-yellow-400 sm:text-5xl lg:text-6xl text-center">
                  Pricing for Nano Banana AI
                </h1>
              </div>

              {/* Cycle Toggle */}
              <div className="flex w-full flex-col items-center">
                <div className="mb-16 flex items-center rounded-full bg-zinc-900 p-1 border border-zinc-800">
                  <button
                    onClick={() => setIsYearly(false)}
                    className={`rounded-full px-8 py-3 transition-all duration-200 font-medium ${
                      !isYearly ? 'bg-yellow-400 text-black shadow-md scale-105' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Bill Monthly
                  </button>
                  <div className="relative">
                    <div className="absolute -right-1 -top-2.5 z-10 sm:-right-2 sm:-top-3">
                      <div className="rounded-md border border-yellow-400 bg-black px-1.5 py-0.5 text-[10px] font-bold text-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.4)] sm:px-2 sm:text-xs">
                        40% OFF
                      </div>
                    </div>
                    <button
                      onClick={() => setIsYearly(true)}
                      className={`rounded-full px-8 py-3 transition-all duration-200 font-medium ${
                        isYearly ? 'bg-yellow-400 text-black shadow-md scale-105' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Bill Yearly
                    </button>
                  </div>
                </div>

                {/* Pricing Cards Grid */}
                <div className={`grid w-full grid-cols-1 gap-6 ${gridColsClass}`}>
                  
                  {/* ====== 1. Basic Plan (Starter) ====== */}
                  {isYearly && (
                    <div className="relative flex flex-col rounded-2xl border-2 border-zinc-800 bg-zinc-900 p-8 shadow-sm transition-all duration-300 hover:border-yellow-400 hover:shadow-lg">
                      {/* --- Header Section --- */}
                      <div className="flex flex-col">
                        <div className="mb-8 h-8"><h3 className="text-xl font-bold text-white">Basic</h3></div>
                        <div className="mb-6 flex h-[90px] flex-col justify-end">
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold tracking-tight text-white">
                              ${pricingData.basic.yearlyPrice}
                            </span>
                            <span className="text-xl text-gray-400">/month</span>
                          </div>
                          <div className="text-md mt-2 text-gray-500">${pricingData.basic.yearlyTotal}/year billed yearly</div>
                        </div>
                        <button 
                          onClick={() => handleCheckout('basic')}
                          disabled={loadingPlan === 'basic'}
                          className={`w-full cursor-pointer rounded-lg px-6 py-3 text-center text-lg font-bold shadow-sm transition-all duration-200 flex justify-center items-center gap-2 ${
                            agreements['basic'] 
                              ? 'bg-yellow-400 text-black hover:bg-yellow-500 hover:scale-[1.02]' 
                              : 'bg-zinc-700 text-gray-300 cursor-not-allowed'
                          }`}
                        >
                          {loadingPlan === 'basic' && <Loader2 className="animate-spin h-5 w-5" />}
                          Get started
                        </button>
                        <AgreementCheckbox planKey="basic" />
                      </div>
                      <div className="mt-6 flex flex-col items-start gap-5 text-sm">
                        <FeatureItem text={<><span className="text-yellow-400 font-bold">{pricingData.basic.credits}</span> Credits renew yearly</>} />
                        <FeatureItem text={<>Up to <span className="text-yellow-400 font-bold">{pricingData.basic.imgs}</span> Nano Banana images</>} />
                        <FeatureItem text={<>Up to <span className="text-yellow-400 font-bold">{pricingData.basic.videos}</span> Veo3 and Veo3.1 Basic videos</>} />
                        <FeatureItem text={<><span className="text-yellow-400 font-bold">Veo3</span> Premium videos (Yearly only)</>} isCross={true} />
                        <FeatureItem text="Download Result" />
                        <FeatureItem text="Download Without Watermark" />
                      </div>
                    </div>
                  )}

                  {/* ====== 2. Standard Plan ====== */}
                  <div className="relative flex flex-col rounded-2xl border-2 border-yellow-400 bg-zinc-900 p-8 shadow-lg shadow-yellow-900/20">
                    <div className="relative">
                      <div className="absolute -right-8 -top-8 rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-black">POPULAR</div>
                    </div>
                    <div className="flex flex-col">
                      <div className="mb-8 h-8"><h3 className="text-xl font-bold text-yellow-400">Standard</h3></div>
                      <div className="mb-6 flex h-[90px] flex-col justify-end">
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold tracking-tight text-white">
                            ${isYearly ? pricingData.standard.yearlyPrice.toFixed(1) : pricingData.standard.monthlyPrice}
                          </span>
                          <span className="text-xl text-gray-400">/month</span>
                          {isYearly && <span className="text-sm text-gray-500 line-through">${pricingData.standard.monthlyPrice}</span>}
                        </div>
                        {isYearly && <div className="text-md mt-2 text-gray-500">${pricingData.standard.yearlyTotal}/year billed yearly</div>}
                        {!isYearly && <div className="text-md mt-2 text-gray-500 opacity-0">Placeholder</div>}
                      </div>
                      <button 
                        onClick={() => handleCheckout('standard')}
                        disabled={loadingPlan === 'standard'}
                        className={`w-full cursor-pointer rounded-lg px-6 py-3 text-center text-lg font-bold shadow-sm transition-all duration-200 flex justify-center items-center gap-2 ${
                          agreements['standard'] 
                            ? 'bg-yellow-400 text-black hover:bg-yellow-500 hover:scale-[1.02]' 
                            : 'bg-zinc-700 text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        {loadingPlan === 'standard' && <Loader2 className="animate-spin h-5 w-5" />}
                        Get started
                      </button>
                      <AgreementCheckbox planKey="standard" />
                    </div>
                    <div className="mt-6 flex flex-col items-start gap-4 text-sm">
                      <FeatureItem text={<><span className="text-yellow-400 font-bold">{pricingData.standard.credits}</span> Credits renew {isYearly ? 'yearly' : 'monthly'}</>} />
                      <FeatureItem text={<>Up to <span className="text-yellow-400 font-bold">{pricingData.standard.imgs}</span> Nano Banana images</>} />
                      <FeatureItem text={<>Up to <span className="text-yellow-400 font-bold">{pricingData.standard.videos}</span> Veo3 and Veo3.1 Basic videos</>} />
                      <FeatureItem text={<><span className="text-yellow-400 font-bold">Veo3</span> Premium videos (Yearly only)</>} isCross={!isYearly} />
                      <FeatureItem text="Download Result" />
                      <FeatureItem text="Download Without Watermark" />
                    </div>
                  </div>

                  {/* ====== 3. Pro Plan ====== */}
                  <div className="relative flex flex-col rounded-2xl border-2 border-zinc-800 bg-zinc-900 p-8 shadow-sm transition-all duration-300 hover:border-yellow-400 hover:shadow-lg">
                    <div className="relative">
                      {isYearly && <div className="absolute -right-8 -top-8 rounded-full bg-yellow-400 px-3 py-1 text-sm font-bold text-black">40% OFF</div>}
                    </div>
                    <div className="flex flex-col">
                      <div className="mb-8 h-8"><h3 className="text-xl font-bold text-white">Pro</h3></div>
                      <div className="mb-6 flex h-[90px] flex-col justify-end">
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold tracking-tight text-white">
                            ${isYearly ? pricingData.pro.yearlyPrice.toFixed(1) : pricingData.pro.monthlyPrice}
                          </span>
                          <span className="text-xl text-gray-400">/month</span>
                          {isYearly && <span className="text-sm text-gray-500 line-through">${pricingData.pro.monthlyPrice}</span>}
                        </div>
                        {isYearly && <div className="text-md mt-2 text-gray-500">${pricingData.pro.yearlyTotal}/year billed yearly</div>}
                        {!isYearly && <div className="text-md mt-2 text-gray-500 opacity-0">Placeholder</div>}
                      </div>
                      <button 
                        onClick={() => handleCheckout('pro')}
                        disabled={loadingPlan === 'pro'}
                        className={`w-full cursor-pointer rounded-lg px-6 py-3 text-center text-lg font-bold shadow-sm transition-all duration-200 flex justify-center items-center gap-2 ${
                          agreements['pro'] 
                            ? 'bg-yellow-400 text-black hover:bg-yellow-500 hover:scale-[1.02]' 
                            : 'bg-zinc-700 text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        {loadingPlan === 'pro' && <Loader2 className="animate-spin h-5 w-5" />}
                        Get started
                      </button>
                      <AgreementCheckbox planKey="pro" />
                    </div>
                    <div className="mt-6 flex flex-col items-start gap-4 text-sm">
                      <FeatureItem text={<><span className="text-yellow-400 font-bold">{pricingData.pro.credits}</span> Credits renew {isYearly ? 'yearly' : 'monthly'}</>} />
                      <FeatureItem text={<>Up to <span className="text-yellow-400 font-bold">{pricingData.pro.imgs}</span> Nano Banana images</>} />
                      <FeatureItem text={<>Up to <span className="text-yellow-400 font-bold">{pricingData.pro.videos}</span> Veo3 and Veo3.1 Basic videos</>} />
                      <FeatureItem text={<><span className="text-yellow-400 font-bold">Veo3</span> Premium videos (Yearly only)</>} isCross={!isYearly} />
                      <FeatureItem text="Download Result" />
                      <FeatureItem text="Download Without Watermark" />
                    </div>
                  </div>

                  {/* ====== 4. Free Plan ====== */}
                  <div className="relative flex flex-col rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 p-2 transition-all duration-300 hover:border-yellow-400">
                    <div className="mb-8 flex w-full flex-col items-start rounded-tl-xl rounded-tr-xl p-8 pb-0">
                      <h3 className="mb-2 text-2xl text-white md:mb-4 md:text-3xl lg:text-4xl">Free plan</h3>
                      <div className="mb-6 flex h-full w-full items-center justify-center text-sm text-gray-400"></div>
                    </div>
                    <div className="flex flex-col items-start gap-5 pl-4 pb-4 text-sm">
                      <FeatureItem text={<><span className="text-yellow-400 font-bold">10</span> Free Credits with login</>} />
                      <FeatureItem text={<>Up to <span className="text-yellow-400 font-bold">2</span> Nano Banana images</>} />
                      <FeatureItem text={<>Up to <span className="text-yellow-400 font-bold">1</span> Veo3 video</>} />
                      <FeatureItem text="Download Result" isCross />
                      <FeatureItem text="Download Without Watermark" isCross />
                    </div>
                    <div className="p-4 mt-auto">
                        <button
                            onClick={() => router.push(user ? '/image' : '/sign-up')}
                            className="w-full cursor-pointer rounded-lg border border-yellow-400/50 bg-transparent px-6 py-3 text-center text-lg font-bold text-yellow-400 shadow-sm transition-all duration-200 hover:bg-yellow-400/10 hover:border-yellow-400"
                        >
                            Try for Free
                        </button>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 border-t border-zinc-800 bg-black text-white md:mt-12">
          <div className="mx-auto max-w-7xl px-6 py-4 pt-5">
            <div className="flex flex-col items-center justify-center text-center gap-4">
              
              <a className="flex items-center" href="/">
                <img className="h-8" alt="nannobanana.ai" src="/logo1.png" />
              </a>
              
              <p className="max-w-3xl text-sm text-gray-400">
                Genea China Holdings Limited
              </p>
              
              <p className="text-xs text-zinc-500">
                © 2026 Genea China Holdings Limited. All rights reserved.
              </p>

            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function FeatureItem({ text, isCross = false }: { text: React.ReactNode, isCross?: boolean }) {
  const iconColor = isCross ? "text-red-500" : "text-yellow-400";
  const textColor = isCross ? "text-gray-500 line-through" : "text-gray-300";

  return (
    <div className="flex flex-row items-start">
      <div className={`flex ltr:mr-2 rtl:ml-2 ${iconColor} shrink-0`}>
        {isCross ? (
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" strokeWidth="2.5" stroke="currentColor">
            <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <path d="M8.82 15.2C8.48 15.2 8.14 15.3 7.85 15.5C7.56 15.7 7.32 16 7.18 16.3C7.03 16.6 6.97 17 7.01 17.3C7.05 17.7 7.19 18 7.41 18.3L12.05 24.3C12.22 24.5 12.43 24.7 12.67 24.8C12.91 24.9 13.18 25 13.44 24.9C14 24.9 14.51 24.6 14.84 24.1L24.48 7.8C24.48 7.8 24.49 7.8 24.49 7.8C24.58 7.6 24.55 7.3 24.36 7.1C24.31 7.1 24.25 7.1 24.18 7C24.12 7 24.05 7 23.98 7C23.91 7 23.84 7 23.78 7.1C23.72 7.1 23.66 7.1 23.62 7.2L13.88 18.8C13.84 18.8 13.8 18.8 13.75 18.9C13.7 18.9 13.64 18.9 13.59 18.9C13.53 18.9 13.47 18.9 13.42 18.9C13.37 18.9 13.32 18.8 13.28 18.8L10.05 15.7C9.72 15.4 9.28 15.2 8.82 15.2Z" fill="currentColor"></path>
          </svg>
        )}
      </div>
      <p className={`${textColor} ml-2 leading-6`}>{text}</p>
    </div>
  );
}