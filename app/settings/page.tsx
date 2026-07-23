"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { SiteHeader } from "@/components/site-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useUpload } from "@/hooks/use-upload";
import { initials } from "@/lib/format";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, isLoading, isAuthenticated } = useCurrentUser();
  const router = useRouter();
  const updateProfile = useMutation(api.users.updateProfile);
  const setAvatar = useMutation(api.users.setAvatar);
  const upload = useUpload();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [init, setInit] = useState(false);

  useEffect(() => {
    if (user && !init) {
      setDisplayName(user.displayName);
      setBio(user.bio ?? "");
      setAvatarUrl(user.avatarUrl);
      setInit(true);
    }
  }, [user, init]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/signin");
  }, [isLoading, isAuthenticated, router]);

  async function handleAvatar(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片");
      return;
    }
    setUploading(true);
    try {
      const { storageId, url } = await upload(file);
      await setAvatar({ storageId: storageId as Id<"_storage"> });
      setAvatarUrl(url);
      toast.success("头像已更新");
    } catch {
      toast.error("上传失败");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await updateProfile({ displayName, bio });
      toast.success("已保存");
    } catch {
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-svh bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-bold">个人设置</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">头像</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-5">
            <Avatar className="h-20 w-20 border border-border/60">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-xl">
                {initials(displayName || "?")}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button
                variant="outline"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "上传中…" : "更换头像"}
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                建议使用正方形图片
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAvatar(f);
                  e.target.value = "";
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">昵称</Label>
              <Input
                id="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">简介</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="介绍一下你自己…"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={save} disabled={saving}>
                {saving ? "保存中…" : "保存"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
