"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useState } from "react";

interface Props {
  userEmail: string | null;
}

export default function NavBar({ userEmail }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
    setLoading(false);
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 10,
        backdropFilter: "blur(10px)",
        background: "rgba(11,18,33,0.75)",
      }}
    >
      <Link href="/" style={{ fontWeight: 800, letterSpacing: 0.2 }}>
        🧠 PhiloMatch
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {userEmail ? (
          <>
            <NavLink href="/" active={isActive("/")}>主页</NavLink>
            <NavLink href="/history" active={pathname?.startsWith("/history") ?? false}>
              历史记录
            </NavLink>
            <span className="small" style={{ color: "var(--muted)" }}>
              {userEmail}
            </span>
            <button className="btn" onClick={handleLogout} disabled={loading}>
              {loading ? "退出中..." : "退出"}
            </button>
          </>
        ) : (
          <>
            <NavLink href="/login" active={isActive("/login")}>登录</NavLink>
            <NavLink href="/signup" active={isActive("/signup")}>注册</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

function NavLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        background: active ? "rgba(148,163,184,0.16)" : "transparent",
        color: "inherit",
        border: active ? "1px solid var(--border)" : "1px solid transparent",
        transition: "all 0.2s ease",
      }}
    >
      {children}
    </Link>
  );
}
