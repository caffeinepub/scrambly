import { Users, X, ZoomIn, ZoomOut } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

const VIEWERS_KEY_PREFIX = "scrambly_img_viewers_";

function getViewerKey(imageUrl: string): string {
  // Use a hash of the URL to keep keys short
  return VIEWERS_KEY_PREFIX + btoa(imageUrl).slice(0, 32);
}

function getViewerCount(imageUrl: string): number {
  try {
    const val = localStorage.getItem(getViewerKey(imageUrl));
    return val ? Number.parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

function incrementViewerCount(imageUrl: string): number {
  try {
    const key = getViewerKey(imageUrl);
    const current = getViewerCount(imageUrl);
    const next = current + 1;
    localStorage.setItem(key, String(next));
    return next;
  } catch {
    return 1;
  }
}

interface ImageViewerModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  altText?: string;
}

export default function ImageViewerModal({
  imageUrl,
  isOpen,
  onClose,
  altText = "Post image",
}: ImageViewerModalProps) {
  const [zoom, setZoom] = useState(100);
  const [viewerCount, setViewerCount] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const overlayRef = useRef<HTMLDialogElement>(null);

  // Increment viewer count when modal opens
  useEffect(() => {
    if (isOpen && imageUrl) {
      const count = incrementViewerCount(imageUrl);
      setViewerCount(count);
      setZoom(100);
      setShowViewers(false);
    }
  }, [isOpen, imageUrl]);

  // Keyboard escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <dialog
      ref={overlayRef}
      open
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 m-0 p-0 max-w-none max-h-none w-full h-full border-0"
      onClick={handleOverlayClick}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      aria-label="Image viewer"
      data-ocid="image_viewer.modal"
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-black/60 z-10">
        {/* Users who saw this */}
        <button
          type="button"
          onClick={() => setShowViewers((v) => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors"
          data-ocid="image_viewer.toggle"
        >
          <Users className="w-4 h-4" />
          <span>👥 Users who saw this: {viewerCount}</span>
        </button>

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
          aria-label="Close image viewer"
          data-ocid="image_viewer.close_button"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Viewer count tooltip */}
      {showViewers && (
        <div className="absolute top-14 left-4 z-20 bg-black/80 border border-white/20 rounded-xl px-4 py-3 text-white text-sm shadow-xl">
          <p className="font-bold mb-1">👥 Viewers</p>
          <p>
            <span className="text-2xl font-fredoka text-yellow-400">
              {viewerCount}
            </span>{" "}
            {viewerCount === 1 ? "person has" : "people have"} seen this image.
          </p>
        </div>
      )}

      {/* Image */}
      <div className="flex-1 flex items-center justify-center w-full overflow-auto px-4">
        <img
          src={imageUrl}
          alt={altText}
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "center",
            transition: "transform 0.2s ease",
          }}
          className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl select-none"
          draggable={false}
        />
      </div>

      {/* Bottom zoom controls */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 px-4 py-4 bg-black/60">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(25, z - 25))}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors disabled:opacity-40"
          disabled={zoom <= 25}
          aria-label="Zoom out"
          data-ocid="image_viewer.zoom_out.button"
        >
          <ZoomOut className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 flex-1 max-w-xs">
          <span className="text-white text-xs w-10 text-right">{zoom}%</span>
          <input
            type="range"
            min={25}
            max={300}
            step={25}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-yellow-400 cursor-pointer"
            aria-label="Zoom level"
            data-ocid="image_viewer.zoom.input"
          />
          <span className="text-white text-xs w-10">300%</span>
        </div>

        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(300, z + 25))}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors disabled:opacity-40"
          disabled={zoom >= 300}
          aria-label="Zoom in"
          data-ocid="image_viewer.zoom_in.button"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
      </div>
    </dialog>
  );
}
