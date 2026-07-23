"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useUpload } from "@/hooks/use-upload";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  TextBoldIcon,
  TextItalicIcon,
  TextUnderlineIcon,
  QuoteDownIcon,
  Link01Icon,
  Image01Icon,
  ListViewIcon,
  Heading01Icon,
  Heading02Icon,
} from "@hugeicons/core-free-icons";

function ToolbarButton({
  onClick,
  icon,
  title,
}: {
  onClick: () => void;
  icon: typeof TextBoldIcon;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <HugeiconsIcon icon={icon} size={17} />
    </button>
  );
}

export function RichEditor({
  value,
  onChange,
  placeholder = "写下你的故事…",
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useUpload();
  const [uploading, setUploading] = useState(false);
  const [focused, setFocused] = useState(false);

  const exec = useCallback(
    (command: string, arg?: string) => {
      document.execCommand(command, false, arg);
      if (ref.current) onChange(ref.current.innerHTML);
      ref.current?.focus();
    },
    [onChange]
  );

  const handleInput = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const insertImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件");
      return;
    }
    setUploading(true);
    try {
      const { url } = await upload(file);
      if (url) {
        ref.current?.focus();
        exec(
          "insertHTML",
          `<img src="${url}" alt="" class="my-4 rounded-xl w-full" />`
        );
        toast.success("图片已插入");
      }
    } catch {
      toast.error("图片上传失败");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border bg-card transition-colors",
        focused ? "border-primary/60 ring-2 ring-primary/10" : "border-border/60"
      )}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border/60 bg-muted/30 p-2">
        <ToolbarButton icon={Heading01Icon} title="标题" onClick={() => exec("formatBlock", "<h2>")} />
        <ToolbarButton icon={Heading02Icon} title="小标题" onClick={() => exec("formatBlock", "<h3>")} />
        <Separator orientation="vertical" className="mx-1 h-5" />
        <ToolbarButton icon={TextBoldIcon} title="加粗" onClick={() => exec("bold")} />
        <ToolbarButton icon={TextItalicIcon} title="斜体" onClick={() => exec("italic")} />
        <ToolbarButton icon={TextUnderlineIcon} title="下划线" onClick={() => exec("underline")} />
        <Separator orientation="vertical" className="mx-1 h-5" />
        <ToolbarButton icon={ListViewIcon} title="列表" onClick={() => exec("insertUnorderedList")} />
        <ToolbarButton icon={QuoteDownIcon} title="引用" onClick={() => exec("formatBlock", "<blockquote>")} />
        <ToolbarButton
          icon={Link01Icon}
          title="链接"
          onClick={() => {
            const url = prompt("输入链接地址");
            if (url) exec("createLink", url);
          }}
        />
        <Separator orientation="vertical" className="mx-1 h-5" />
        <ToolbarButton
          icon={Image01Icon}
          title="插入图片"
          onClick={() => fileRef.current?.click()}
        />
        {uploading && (
          <span className="ml-2 text-xs text-muted-foreground">上传中…</span>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) insertImage(f);
            e.target.value = "";
          }}
        />
      </div>

      {/* Editable area */}
      <div className="relative">
        {(!value || value === "<br>") && (
          <div className="pointer-events-none absolute top-5 left-5 text-muted-foreground">
            {placeholder}
          </div>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          dangerouslySetInnerHTML={{ __html: value }}
          className="prose-editor min-h-[320px] p-5 text-[15px] leading-relaxed outline-none"
        />
      </div>
    </div>
  );
}
