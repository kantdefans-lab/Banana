// /src/components/layout/Header.tsx
'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const t = useTranslations('Navigation');
  
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">
              AI Image Generator
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/generate" className="text-gray-700 hover:text-purple-600">
              {t('generate')}
            </Link>
            <Link href="/gallery" className="text-gray-700 hover:text-purple-600">
              {t('gallery')}
            </Link>
            <Link href="/pricing" className="text-gray-700 hover:text-purple-600">
              {t('pricing')}
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <Link 
              href="/generate" 
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90"
            >
              {t('start')}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}