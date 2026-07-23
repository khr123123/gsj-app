"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SiteHeader } from "@/components/site-header";
import { RichEditor } from "@/components/rich-editor";
import { CoverUploader } from "@/components/cover-uploader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { Id } from "@/convex/_generated/dataModel";

function WriteInner() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("id") as Id<"blogs"> | null;
  const { isAuthenticated, isLoading } = useCurrentUser();

  const existing = useQuery(
    api.blogs.get,
    editId ? { blogId: editId } : "skip"
  );

  const createBlog = useMutation(api.blogs.create);
  const updateBlog = useMutation(api.blogs.update);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [cover, setCover] = useState<{ storageId?: string; url?: string }>({});
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (existing && !loaded) {
      setTitle(existing.title);
      setContent(existing.content);
      setCover({ url: existing.coverUrl });
      setIsPublic(existing.visibility === "public");
      setLoaded(true);
    }
  }, [existing, loaded]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [isLoading, isAuthenticated, router]);

  async function save(publish: boolean) {
    if (!title.trim()) {
      toast.error("请填写标题");
      return;
    }
    setSaving(true);
    try {
      const visibility = isPublic ? "public" : "hidden";
      if (editId) {
        await updateBlog({
          blogId: editId,
          title,
          content,
          visibility,
          published: publish,
          ...(cover.storageId
            ? { coverStorageId: cover.storageId as Id<"_storage"> }
            : {}),
        });
        toast.success("已更新");
        router.push(`/blog/${editId}`);
      } else {
        const id = await createBlog({
          title,
          content,
          visibility,
          published: publish,
          ...(cover.storageId
            ? { coverStorageId: cover.storageId as Id<"_storage"> }
            : {}),
        });
        toast.success(publish ? "已发布" : "已保存草稿");
        router.push(`/blog/${id}`);
      }
    } catch (e) {
      console.error(e);
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-svh bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            {editId ? "编辑博客" : "写博客"}
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="visibility"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="visibility" className="text-sm">
                {isPublic ? "公开" : "仅自己可见"}
              </Label>
            </div>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => save(false)}
            >
              存草稿
            </Button>
            <Button disabled={saving} onClick={() => save(true)}>
              {saving ? "保存中…" : "发布"}
            </Button>
          </div>
        </div>

        <div className="space-y-5">
          <CoverUploader url={cover.url} onChange={setCover} />
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="一个吸引人的标题…"
            className="h-14 border-0 bg-transparent px-1 text-2xl font-bold shadow-none focus-visible:ring-0"
          />
          <RichEditor value={content} onChange={setContent} />
        </div>
      </main>
    </div>
  );
}

export default function WritePage() {
  return (
    <Suspense fallback={null}>
      <WriteInner />
    </Suspense>
  );
}
