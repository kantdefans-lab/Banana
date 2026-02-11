import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "哲学小思考配对器",
  description: "输入你的碎碎念，看看你更像哪位哲学家。",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="zh-CN">
      <body>
        <NavBar userEmail={user?.email ?? null} />
        <main>{children}</main>
      </body>
    </html>
  );
}
