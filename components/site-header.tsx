"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/format";
import { OnlineBadge } from "@/components/online-badge";

export function SiteHeader() {
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const { signOut } = useAuthActions();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-md">
            时
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">时光轴</div>
            <div className="text-[10px] text-muted-foreground">
              Timeline Blog
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <OnlineBadge />

          {!isLoading && isAuthenticated && user ? (
            <>
              <Button  size="sm" className="hidden sm:inline-flex">
                <Link href="/write">写博客</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger >
                    <Avatar className="h-9 w-9 border border-border/60">
                      <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                      <AvatarFallback>
                        {initials(user.displayName)}
                      </AvatarFallback>
                    </Avatar>
                </DropdownMenuTrigger>
         <DropdownMenuContent align="end" className="w-52">
  <DropdownMenuGroup>
    <DropdownMenuLabel className="truncate">
      {user.displayName}
    </DropdownMenuLabel>
  </DropdownMenuGroup>

  <DropdownMenuSeparator />

  <DropdownMenuItem onClick={() => router.push(`/u/${user._id}`)}>
    我的主页
  </DropdownMenuItem>

  <DropdownMenuItem onClick={() => router.push("/write")}>
    写博客
  </DropdownMenuItem>

  <DropdownMenuItem onClick={() => router.push("/settings")}>
    个人设置
  </DropdownMenuItem>

  <DropdownMenuSeparator />

  <DropdownMenuItem
    onClick={async () => {
      await signOut();
      router.push("/");
    }}
  >
    退出登录
  </DropdownMenuItem>
</DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button  size="sm">
              <Link href="/signin">登录 / 注册</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
