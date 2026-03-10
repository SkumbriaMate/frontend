"use client";

import { useRef, useState, useEffect } from "react";
import { ImagePlus, X } from "lucide-react";


interface FileChooserWithPreviewProps {
  file: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  label?: string;
  existingImageUrl?: string | null;
  previewHeight?: number;
  objectFit?: "cover" | "contain";
  /** Compact inline style for forms (e.g. gallery add row) */
  compact?: boolean;
}

export default function FileChooserWithPreview({
  file,
  onChange,
  accept = "image/*",
  label = "ფოტო",
  existingImageUrl,
  previewHeight = 140,
  objectFit = "cover",
  compact = false,
}: FileChooserWithPreviewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
      onChange(f);
    } else {
      setPreviewUrl(null);
      onChange(null);
    }
    e.target.value = "";
  };

  useEffect(() => {
    if (!file) {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }, [file]);

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onChange(null);
    inputRef.current?.value && (inputRef.current.value = "");
  };

  const displayUrl = previewUrl || (!file && existingImageUrl) || null;
  const hasPreview = !!displayUrl;

  if (compact) {
    const h = 80;
    return (
      <div className="flex-shrink-0">
        {label && (
          <label className="block text-[10px] font-bold text-[#4a4a55] uppercase tracking-widest mb-2">
            {label}
          </label>
        )}
        <div
          className="rounded-lg border border-dashed border-[#252529] bg-[#0e0e10] transition-all hover:border-[#3a3a42] hover:bg-[#16161a] cursor-pointer overflow-hidden flex items-center"
          style={{ width: 140, minHeight: h }}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f && f.type.startsWith("image/")) {
              if (previewUrl) URL.revokeObjectURL(previewUrl);
              const url = URL.createObjectURL(f);
              setPreviewUrl(url);
              onChange(f);
            }
          }}
        >
          <input ref={inputRef} type="file" accept={accept} onChange={handleFileChange} className="hidden" />
          {displayUrl ? (
            <div className="relative w-full h-full flex items-center justify-center group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={displayUrl} alt="" className="w-full h-full object-cover" style={{ height: h }} />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                <button type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }} className="px-2 py-1 rounded bg-white/90 text-black text-[10px] font-semibold">შეცვლა</button>
                <button type="button" onClick={(e) => { e.stopPropagation(); handleClear(); }} className="p-1 rounded bg-red-500/90 text-white"><X size={12} /></button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 w-full py-3 px-2">
              <ImagePlus size={18} className="text-[#6b6b75]" />
              <span className="text-[10px] text-[#6b6b75] text-center leading-tight">ფაილის არჩევა</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-[10px] font-bold text-[#4a4a55] uppercase tracking-widest mb-2">
        {label}
      </label>
      <div
        className="rounded-xl border border-dashed border-[#252529] bg-[#0e0e10] transition-all hover:border-[#3a3a42] hover:bg-[#16161a] cursor-pointer overflow-hidden"
        style={{ minHeight: previewHeight }}
        onClick={() => !hasPreview && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f && f.type.startsWith("image/")) {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            const url = URL.createObjectURL(f);
            setPreviewUrl(url);
            onChange(f);
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
        {displayUrl ? (
          <div className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayUrl}
              alt=""
              className="w-full"
              style={{ height: previewHeight, objectFit }}
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                className="px-3 py-1.5 rounded-lg bg-white/90 text-black text-xs font-semibold hover:bg-white"
              >
                შეცვლა
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="p-1.5 rounded-lg bg-red-500/90 text-white hover:bg-red-500"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center gap-2 py-6 px-4"
          >
            <div className="w-12 h-12 rounded-xl bg-[#252529] flex items-center justify-center">
              <ImagePlus size={22} className="text-[#6b6b75]" />
            </div>
            <span className="text-xs text-[#6b6b75] text-center">
              დააწექით ან გადმოიტანეთ ფაილი
            </span>
            <span className="text-[10px] text-[#4a4a55]">PNG, JPG, GIF</span>
          </div>
        )}
      </div>
    </div>
  );
}
