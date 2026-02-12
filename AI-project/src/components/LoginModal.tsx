'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// 引入认证客户端
import { signIn, signUp } from '@/core/auth/client'; 
import { formatAuthErrorMessage } from '@/shared/lib/auth-error';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const router = useRouter();

  // 禁止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. 协议校验
    if (!agreed) {
      alert('Please read and agree to the User Agreement and Privacy Policy first.');
      return;
    }

    if (!formData.email || !formData.password) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signin') {
        // ==========================================
        // 🟢 修复：使用 signIn.email 进行登录
        // ==========================================
        const res = await signIn.email({ 
          email: formData.email, 
          password: formData.password 
        });

        // 检查返回结果中是否有 error
        if (res?.error) {
          alert('Login failed: ' + formatAuthErrorMessage(res.error));
        } else {
          // 登录成功
          onClose();
          router.refresh(); 
        }

      } else {
        // ==========================================
        // 🔵 修复：使用 signUp.email 进行注册
        // ==========================================
        const res = await signUp.email({ 
          email: formData.email, 
          password: formData.password,
          name: formData.name 
        });

        if (res?.error) {
          alert('Registration failed: ' + formatAuthErrorMessage(res.error));
        } else {
          alert('Account created successfully! Please log in.');
          setMode('signin');
        }
      }

    } catch (error: any) {
      console.error('Auth error:', error);
      alert(formatAuthErrorMessage(error, 'An error occurred. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!agreed) {
      alert('Please read and agree to the User Agreement and Privacy Policy first.');
      return;
    }
    
    setIsLoading(true);
    try {
      // ==========================================
      // 🟡 修复：使用 signIn.social 进行 Google 登录
      // ==========================================
      // 根据错误提示，signIn 对象中包含 social 方法
      await signIn.social({
        provider: 'google',
        callbackURL: window.location.href // 登录后跳回当前页面
      });
    } catch (error: unknown) {
      console.error("Google Auth Error:", error);
      alert(formatAuthErrorMessage(error, 'Failed to initiate Google login.'));
      setIsLoading(false);
    }
    // 注意：如果是跳转式登录，setIsLoading(false) 可能不会执行，这是正常的
  };

  return (
    <div 
      role="dialog" 
      data-state="open" 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div 
        className="relative z-50 grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-lg border bg-white p-6 shadow-lg duration-200 sm:max-w-[425px] dark:bg-gray-950 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          type="button" 
          className="absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="flex flex-col gap-2 text-center sm:text-left">
          <h2 className="text-lg leading-none font-semibold">
            {mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </h2>
          <p className="text-muted-foreground text-sm text-gray-500">
            {mode === 'signin' ? 'Sign in to your account' : 'Create an account to get started'}
          </p>
        </div>

        <div className="w-full md:max-w-md">
          <form className="grid gap-4" onSubmit={handleSubmit}>
            
            {mode === 'signup' && (
              <div className="grid gap-2">
                <label className="flex items-center gap-2 text-sm leading-none font-medium select-none" htmlFor="name">Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input 
                    className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700" 
                    id="name" 
                    placeholder="Your name" 
                    required={mode === 'signup'}
                    type="text" 
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <label className="flex items-center gap-2 text-sm leading-none font-medium select-none" htmlFor="email">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                  className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700" 
                  id="email" 
                  placeholder="name@example.com" 
                  required 
                  type="email" 
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="flex items-center gap-2 text-sm leading-none font-medium select-none" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                  className="flex h-9 w-full rounded-md border border-gray-200 bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700" 
                  id="password" 
                  placeholder="******" 
                  autoComplete={mode === 'signin' ? "current-password" : "new-password"} 
                  required 
                  type="password" 
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* 协议勾选框 */}
            <div className="flex items-start space-x-2 py-1">
              <input 
                type="checkbox" 
                id="terms" 
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer" 
                required
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <label htmlFor="terms" className="text-xs text-gray-500 dark:text-gray-400 leading-tight cursor-pointer select-none">
                I have read and agree to the{' '}
                <Link href="/terms-of-service" target="_blank" className="text-blue-600 hover:underline dark:text-blue-400 font-medium">User Agreement</Link>
                {' '}and{' '}
                <Link href="/privacy-policy" target="_blank" className="text-blue-600 hover:underline dark:text-blue-400 font-medium">Privacy Policy</Link>
                .
              </label>
            </div>

            <button 
              className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all h-9 px-4 py-2 w-full text-white shadow-sm ${agreed && !isLoading ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
              type="submit"
              disabled={!agreed || isLoading}
            >
              {isLoading && <Loader2 className="animate-spin h-4 w-4" />}
              <span>
                {isLoading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : 'Sign Up')}
              </span>
            </button>
          </form>

          <div className="flex w-full items-center gap-2 flex-col justify-between mt-4">
            <div className="relative w-full flex items-center py-2">
              <div className="grow border-t border-gray-200 dark:border-gray-800"></div>
              <span className="shrink-0 px-2 text-xs text-gray-400 uppercase">Or continue with</span>
              <div className="grow border-t border-gray-200 dark:border-gray-800"></div>
            </div>

            <button 
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full gap-2 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M3.06364 7.50914C4.70909 4.24092 8.09084 2 12 2C14.6954 2 16.959 2.99095 18.6909 4.60455L15.8227 7.47274C14.7864 6.48185 13.4681 5.97727 12 5.97727C9.39542 5.97727 7.19084 7.73637 6.40455 10.1C6.2045 10.7 6.09086 11.3409 6.09086 12C6.09086 12.6591 6.2045 13.3 6.40455 13.9C7.19084 16.2636 9.39542 18.0227 12 18.0227C13.3454 18.0227 14.4909 17.6682 15.3864 17.0682C16.4454 16.3591 17.15 15.3 17.3818 14.05H12V10.1818H21.4181C21.5364 10.8363 21.6 11.5182 21.6 12.2273C21.6 15.2727 20.5091 17.8363 18.6181 19.5773C16.9636 21.1046 14.7 22 12 22C8.09084 22 4.70909 19.7591 3.06364 16.4909C2.38638 15.1409 2 13.6136 2 12C2 10.3864 2.38638 8.85911 3.06364 7.50914Z"></path></svg>
              <span>Sign in with Google</span>
            </button>
          </div>
        </div>

        <div className="flex w-full justify-center border-t border-gray-100 dark:border-gray-800 py-4 mt-2">
          {mode === 'signin' ? (
            <p className="text-center text-xs text-neutral-500">
              Don't have an account?{' '}
              <button 
                onClick={() => setMode('signup')} 
                className="underline cursor-pointer text-blue-600 hover:text-blue-800 dark:text-white/70 dark:hover:text-white font-medium"
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p className="text-center text-xs text-neutral-500">
              Already have an account?{' '}
              <button 
                onClick={() => setMode('signin')} 
                className="underline cursor-pointer text-blue-600 hover:text-blue-800 dark:text-white/70 dark:hover:text-white font-medium"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
