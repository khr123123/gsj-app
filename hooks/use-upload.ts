"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useConvex } from "convex/react";

// Uploads a file to Convex storage and returns { storageId, url }.
export function useUpload() {
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const convex = useConvex();

  return async function upload(file: File) {
    const postUrl = await generateUploadUrl();
    const res = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!res.ok) throw new Error("上传失败");
    const { storageId } = (await res.json()) as { storageId: string };
    const url = await convex.query(api.users.getImageUrl, {
      storageId: storageId as any,
    });
    return { storageId, url: url ?? undefined };
  };
}
