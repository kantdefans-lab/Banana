import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <div className="stack" style={{ alignItems: "center", gap: 16 }}>
      <h1>欢迎回来</h1>
      <p className="small">登录后开始你的哲学配对之旅。</p>
      <AuthForm mode="login" />
      <p className="small">
        还没有账号？ <Link href="/signup">去注册</Link>
      </p>
    </div>
  );
}
