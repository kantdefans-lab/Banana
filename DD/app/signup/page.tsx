import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <div className="stack" style={{ alignItems: "center", gap: 16 }}>
      <h1>注册账号</h1>
      <p className="small">用邮箱 + 密码创建账户，解锁哲学家的朋友圈。</p>
      <AuthForm mode="signup" />
      <p className="small">
        已有账号？ <Link href="/login">去登录</Link>
      </p>
    </div>
  );
}
