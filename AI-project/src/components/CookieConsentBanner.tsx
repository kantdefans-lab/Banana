'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import {
  ANALYTICS_CONSENT_COOKIE,
  ANALYTICS_CONSENT_MAX_AGE_SECONDS,
  AnalyticsConsentValue,
  COOKIE_CONSENT_OPEN_EVENT,
} from '@/shared/constants/consent';

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const cookieString = document.cookie || '';
  const cookies = cookieString.split(';');
  for (const part of cookies) {
    const [rawKey, ...rawValParts] = part.trim().split('=');
    if (!rawKey) continue;
    if (rawKey === name) {
      return decodeURIComponent(rawValParts.join('=') || '');
    }
  }
  return null;
}

function setConsentCookie(value: AnalyticsConsentValue) {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const parts = [
    `${ANALYTICS_CONSENT_COOKIE}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${ANALYTICS_CONSENT_MAX_AGE_SECONDS}`,
    'SameSite=Lax',
  ];
  if (secure) parts.push('Secure');
  document.cookie = parts.join('; ');
}

export default function CookieConsentBanner({
  initialConsent,
}: {
  initialConsent?: AnalyticsConsentValue | null;
}) {
  const [consent, setConsent] = useState<AnalyticsConsentValue | null | undefined>(initialConsent);
  const [isOpen, setIsOpen] = useState(() => initialConsent == null ? true : false);

  useEffect(() => {
    if (consent !== undefined) return;

    const current = getCookieValue(ANALYTICS_CONSENT_COOKIE);
    if (current === 'granted' || current === 'denied') {
      setConsent(current);
      setIsOpen(false);
      return;
    }

    setConsent(null);
    setIsOpen(true);
  }, [consent]);

  useEffect(() => {
    const onOpen = () => setIsOpen(true);
    window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, onOpen);
  }, []);

  const currentStatusText = useMemo(() => {
    if (consent === 'granted') return 'Enabled';
    if (consent === 'denied') return 'Disabled';
    return 'Not set';
  }, [consent]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-800 bg-black/95 text-white backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:gap-6">
        <div className="text-sm text-gray-200">
          <div className="font-semibold text-white">Privacy &amp; analytics</div>
          <p className="mt-1 text-gray-300">
            We use cookies and similar technologies to run Google Analytics (GA4) and Microsoft Clarity so we can
            understand usage and improve the product.{' '}
            <Link href="/privacy-policy/" className="text-indigo-300 hover:text-indigo-200 underline underline-offset-2">
              Learn more
            </Link>
            .
          </p>
          <p className="mt-1 text-xs text-gray-400">Current setting: {currentStatusText}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => {
              setConsentCookie('denied');
              setConsent('denied');
              window.location.reload();
            }}
            className="inline-flex items-center justify-center rounded-md border border-gray-700 bg-transparent px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-900"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => {
              setConsentCookie('granted');
              setConsent('granted');
              window.location.reload();
            }}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm text-gray-400 hover:text-white"
            aria-label="Close cookie banner"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
