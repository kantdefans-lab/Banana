import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options?: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // read-only in some contexts
        }
      },
      remove(name: string, options?: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options, expires: new Date(0) });
        } catch {
          // ignore
        }
      },
    },
  });
}

export function createRouteClient(req: NextRequest, res: NextResponse) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options?: CookieOptions) {
        res.cookies.set({ name, value, ...options });
      },
      remove(name: string, options?: CookieOptions) {
        res.cookies.set({ name, value: "", ...options, expires: new Date(0) });
      },
    },
  });
}

export function createServiceRoleClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const keyToUse = serviceKey || supabaseAnonKey;

  return createServerClient(supabaseUrl, keyToUse, {
    cookies: {
      get() {
        return undefined;
      },
      set() {
        return undefined as unknown as void;
      },
      remove() {
        return undefined as unknown as void;
      },
    },
  });
}
