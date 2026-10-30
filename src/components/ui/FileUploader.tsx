"use client";

import Image from "next/image";
import { useId, useRef, useState, type DragEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/foundations/Icon";
import { Button } from "./Button";
import { HelperText } from "./Field";
import { IconButton } from "./IconButton";

/* ───────────── Dropzone ───────────── */

export interface FileDropzoneProps {
  /** 상단 안내 (파일 형식·용량 제한) */
  helperText?: string;
  /** 에러 메시지 — 있으면 에러 상태이며 안내를 대체 */
  errorMessage?: string;
  disabled?: boolean;
  /** 안내문구 */
  guideText?: ReactNode;
  dragoverText?: ReactNode;
  disabledText?: ReactNode;
  buttonLabel?: string;
  accept?: string;
  multiple?: boolean;
  onFiles?: (files: File[]) => void;
  /** 문서/스토리용: dragover 상태를 강제로 표시 */
  dragover?: boolean;
  className?: string;
}

export function FileDropzone({
  helperText,
  errorMessage,
  disabled = false,
  guideText = "사진을 여기로 끌어다 놓거나",
  dragoverText = "여기에 놓으면 바로 업로드돼요",
  disabledText = "사진을 더 올릴 수 없어요",
  buttonLabel = "파일 선택",
  accept,
  multiple = true,
  onFiles,
  dragover,
  className,
}: FileDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const isDrag = !disabled && (dragover || dragging);
  const isError = Boolean(errorMessage) && !disabled;

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    onFiles?.(Array.from(e.dataTransfer.files));
  };

  const box = disabled
    ? "border-[1.5px] border-border-disabled bg-background-disabled"
    : isDrag
      ? "border-2 border-border-brand bg-background-default"
      : isError
        ? "border-[1.5px] border-border-error bg-background-default"
        : "border-[1.5px] border-border-strong bg-background-default";
  const iconColor = disabled
    ? "text-text-disabled"
    : isDrag
      ? "text-text-brand"
      : isError
        ? "text-text-error"
        : "text-text-tertiary";
  const textColor = disabled ? "text-text-disabled" : isDrag ? "text-text-brand" : "text-text-secondary";

  return (
    <div className={cn("flex w-full flex-col gap-[8px]", className)}>
      <HelperText hint={helperText} error={errorMessage} disabled={disabled} />
      <div
        data-state={disabled ? "disabled" : isDrag ? "dragover" : isError ? "error" : "default"}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex w-full flex-col items-center gap-[10px] rounded-[14px] px-[16px] py-[24px] transition-colors",
          box,
        )}
      >
        <Icon name="image" size={24} className={iconColor} />
        <p className={cn("body-md", textColor)}>
          {disabled ? disabledText : isDrag ? dragoverText : guideText}
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            onFiles?.(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <Button
          variant="secondary"
          size="sm"
          iconLeft="plus"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}

/* ───────────── File Item ───────────── */

export type FileItemStatus = "uploading" | "complete" | "error";

export interface FileItemProps {
  name: string;
  /** 용량 · 진행률 · 에러 사유 */
  meta?: ReactNode;
  status: FileItemStatus;
  thumbnailUrl?: string;
  onRemove?: () => void;
  className?: string;
}

export function FileItem({ name, meta, status, thumbnailUrl, onRemove, className }: FileItemProps) {
  return (
    <div
      data-status={status}
      className={cn(
        "flex w-full items-center gap-[12px] rounded-[12px] bg-background-default p-[10px]",
        status === "error"
          ? "border border-border-error shadow-[inset_0_0_0_0.5px_var(--color-border-error)]"
          : "border border-border-default",
        className,
      )}
    >
      <div className="relative size-[44px] shrink-0 overflow-hidden rounded-[8px] bg-background-muted">
        {thumbnailUrl ? (
          <Image src={thumbnailUrl} alt="" fill sizes="44px" className="object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-text-tertiary">
            <Icon name="image" size={20} />
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <p className="truncate body-md text-text-default">{name}</p>
        {meta && (
          <p className={cn("truncate label-md", status === "error" ? "text-text-error" : "text-text-tertiary")}>
            {meta}
          </p>
        )}
      </div>
      {status === "uploading" && <Icon name="loader" size={20} className="animate-spin text-text-brand" label="업로드 중" />}
      {status === "complete" && <Icon name="check-circle" size={20} className="text-text-success" label="업로드 완료" />}
      {status === "error" && <Icon name="error" size={20} className="text-text-error" label="업로드 실패" />}
      {onRemove && (
        <IconButton icon="close" label={`${name} 삭제`} variant="circle-neutral" size="sm" onClick={onRemove} />
      )}
    </div>
  );
}

/* ───────────── File Uploader (드롭존 + 파일선택버튼 결합 단일형) ───────────── */

export interface UploadedFile {
  id: string;
  name: string;
  meta?: ReactNode;
  status: FileItemStatus;
  thumbnailUrl?: string;
}

export interface FileUploaderProps extends Omit<FileDropzoneProps, "className"> {
  files: UploadedFile[];
  onRemove?: (id: string) => void;
  className?: string;
}

export function FileUploader({ files, onRemove, className, ...dropzone }: FileUploaderProps) {
  return (
    <div className={cn("flex w-full flex-col gap-[12px]", className)}>
      <FileDropzone {...dropzone} />
      {files.length > 0 && (
        <ul className="flex flex-col gap-[8px]" aria-label="업로드한 파일">
          {files.map((f) => (
            <li key={f.id}>
              <FileItem {...f} onRemove={onRemove ? () => onRemove(f.id) : undefined} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
