"use client";

import { useRef, useState } from "react";
import { useUpload } from "@/hooks/use-upload";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Image01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

export function CoverUploader({
  url,
  onChange,
}: {
  url?: string;
  onChange: (v: { storageId?: string; url?: string }) => void;
}) {
  const upload = useUpload();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handle(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片");
      return;
    }
    setUploading(true);
    try {
      const res = await upload(file);
      onChange({ storageId: res.storageId, url: res.url });
      toast.success("封面已上传");
    } catch {
      toast.error("上传失败");
    } finally {
      setUploading(false);
    }
  }

  if (url) {
    return (
      <div className="group relative h-52 w-full overflow-hidden rounded-2xl border border-border/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="封面" className="h-full w-full object-cover" />
        <button
          type="button"
          onClick={() => onChange({ storageId: undefined, url: undefined })}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={16} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => fileRef.current?.click()}
      className="flex h-52 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/20 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/40"
    >
      <HugeiconsIcon icon={Image01Icon} size={28} />
      <span className="text-sm">
        {uploading ? "上传中…" : "点击上传封面图片(可选)"}
      </span>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handle(f);
          e.target.value = "";
        }}
      />
    </button>
  );
}
