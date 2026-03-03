"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { ZoomIn, ZoomOut, RotateCw, Check, X } from "lucide-react";

interface ImageCropModalProps {
  imageSrc: string;
  onComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<Blob> {
  const image = await createImageBitmap(await fetch(imageSrc).then((r) => r.blob()));
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas is empty"));
      },
      "image/jpeg",
      0.9
    );
  });
}

export function compressImage(blob: Blob, maxSizeKB = 500): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);

      const quality = 0.9;
      let width = img.width;
      let height = img.height;
      const MAX_DIM = 1024;
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      const tryCompress = (q: number) => {
        canvas.toBlob(
          (compressed) => {
            if (!compressed) { resolve(blob); return; }
            if (compressed.size <= maxSizeKB * 1024 || q <= 0.3) {
              resolve(compressed);
            } else {
              tryCompress(q - 0.1);
            }
          },
          "image/jpeg",
          q
        );
      };

      if (blob.size <= maxSizeKB * 1024) {
        // Already small enough, just resize if needed
        canvas.toBlob((b) => resolve(b ?? blob), "image/jpeg", quality);
      } else {
        tryCompress(quality);
      }
    };
    img.src = url;
  });
}

export function ImageCropModal({ imageSrc, onComplete, onCancel }: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      const compressed = await compressImage(croppedBlob, 500);
      onComplete(compressed);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 border-b border-white/10">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
          <span className="text-sm">취소</span>
        </button>
        <span className="text-white text-sm font-medium">사진 편집</span>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={processing}
          className="flex items-center gap-2 text-green-400 hover:text-green-300 disabled:opacity-50 transition-colors"
        >
          <span className="text-sm font-semibold">{processing ? "처리 중..." : "완료"}</span>
          <Check className="h-5 w-5" />
        </button>
      </div>

      {/* Cropper Area */}
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          style={{
            containerStyle: { background: "#000" },
            cropAreaStyle: {
              border: "3px solid #22c55e",
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.7)",
            },
          }}
        />
      </div>

      {/* Controls */}
      <div className="px-6 py-4 bg-black/80 border-t border-white/10 space-y-4">
        {/* Zoom */}
        <div className="flex items-center gap-3">
          <ZoomOut className="h-4 w-4 text-white/60 shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-green-500"
          />
          <ZoomIn className="h-4 w-4 text-white/60 shrink-0" />
        </div>

        {/* Rotation */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setRotation((r) => r - 90)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
          >
            <RotateCw className="h-4 w-4 rotate-180" />
            <span>-90°</span>
          </button>
          <span className="text-white/40 text-xs min-w-[40px] text-center">{rotation}°</span>
          <button
            type="button"
            onClick={() => setRotation((r) => r + 90)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
          >
            <RotateCw className="h-4 w-4" />
            <span>+90°</span>
          </button>
        </div>
      </div>
    </div>
  );
}
