"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const ensureProfile = useMutation(api.users.ensureProfile);
  const router = useRouter();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const name = String(form.get("name") || email.split("@")[0]);

    try {
      await signIn("password", { email, password, name, flow: mode });
      // Make sure a profile row exists.
      try {
        await ensureProfile({});
      } catch {
        /* ignore */
      }
      toast.success(mode === "signIn" ? "欢迎回来！" : "注册成功，开始记录吧！");
      router.push("/");
    } catch (err) {
      console.error(err);
      toast.error(
        mode === "signIn"
          ? "登录失败，请检查邮箱和密码"
          : "注册失败，邮箱可能已被使用或密码太短(至少 8 位)"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted p-4">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-chart-2/10 blur-3xl" />

      <Card className="relative w-full max-w-md border-border/60 shadow-xl backdrop-blur">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <span className="text-lg font-bold">时</span>
          </div>
          <CardTitle className="text-2xl tracking-tight">
            {mode === "signIn" ? "欢迎回到时光轴" : "加入时光轴"}
          </CardTitle>
          <CardDescription>
            {mode === "signIn"
              ? "登录后继续记录你的故事"
              : "创建账号，开启属于你的时间轴"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            {mode === "signUp" && (
              <div className="space-y-2">
                <Label htmlFor="name">昵称</Label>
                <Input id="name" name="name" placeholder="你的昵称" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="至少 8 位字符"
              />
            </div>
          </CardContent>
          <CardFooter className="mt-2 flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "处理中…"
                : mode === "signIn"
                  ? "登录"
                  : "注册"}
            </Button>
            <button
              type="button"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() =>
                setMode(mode === "signIn" ? "signUp" : "signIn")
              }
            >
              {mode === "signIn"
                ? "还没有账号？点此注册"
                : "已有账号？点此登录"}
            </button>
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:underline"
            >
              先随便逛逛 →
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
