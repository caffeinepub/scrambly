import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PhotoCropModalProps {
  open: boolean;
  imageSrc: string;
  onSubmit: (croppedDataUrl: string) => void;
  onClose: () => void;
}

const HANDLE = 12;
const CORNER_KEYS = ["nw", "ne", "sw", "se"] as const;

function getEdge(x: number, y: number, box: CropBox): string {
  const inLeft = Math.abs(x - box.x) < HANDLE;
  const inRight = Math.abs(x - (box.x + box.w)) < HANDLE;
  const inTop = Math.abs(y - box.y) < HANDLE;
  const inBottom = Math.abs(y - (box.y + box.h)) < HANDLE;
  if (inLeft && inTop) return "nw";
  if (inRight && inTop) return "ne";
  if (inLeft && inBottom) return "sw";
  if (inRight && inBottom) return "se";
  if (inLeft) return "w";
  if (inRight) return "e";
  if (inTop) return "n";
  if (inBottom) return "s";
  if (x > box.x && x < box.x + box.w && y > box.y && y < box.y + box.h)
    return "move";
  return "";
}

export default function PhotoCropModal({
  open,
  imageSrc,
  onSubmit,
  onClose,
}: PhotoCropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [crop, setCrop] = useState<CropBox>({ x: 10, y: 10, w: 80, h: 80 });
  const dragging = useRef<{
    startX: number;
    startY: number;
    origCrop: CropBox;
    edge: string;
  } | null>(null);

  const onImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    setDisplaySize({ w: img.offsetWidth, h: img.offsetHeight });
    const pad = 10;
    setCrop({
      x: pad,
      y: pad,
      w: img.offsetWidth - pad * 2,
      h: img.offsetHeight - pad * 2,
    });
  };

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const edge = getEdge(x, y, crop);
      if (!edge) return;
      e.preventDefault();
      dragging.current = { startX: x, startY: y, origCrop: { ...crop }, edge };
    },
    [crop],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const dx = x - dragging.current.startX;
      const dy = y - dragging.current.startY;
      const orig = dragging.current.origCrop;
      const { w: dw, h: dh } = displaySize;

      setCrop((_prev) => {
        let { x: cx, y: cy, w: cw, h: ch } = orig;
        const edge = dragging.current!.edge;
        if (edge === "move") {
          cx = Math.max(0, Math.min(dw - cw, cx + dx));
          cy = Math.max(0, Math.min(dh - ch, cy + dy));
        } else {
          if (edge.includes("e")) cw = Math.max(20, Math.min(dw - cx, cw + dx));
          if (edge.includes("w")) {
            const newX = Math.max(0, Math.min(cx + cw - 20, cx + dx));
            cw = cw + (cx - newX);
            cx = newX;
          }
          if (edge.includes("s")) ch = Math.max(20, Math.min(dh - cy, ch + dy));
          if (edge.includes("n")) {
            const newY = Math.max(0, Math.min(cy + ch - 20, cy + dy));
            ch = ch + (cy - newY);
            cy = newY;
          }
        }
        return { x: cx, y: cy, w: cw, h: ch };
      });
    };
    const onUp = () => {
      dragging.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [displaySize]);

  const handleSubmit = () => {
    const img = imgRef.current;
    if (!img || !displaySize.w) return;
    const scaleX = naturalSize.w / displaySize.w;
    const scaleY = naturalSize.h / displaySize.h;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(crop.w * scaleX);
    canvas.height = Math.round(crop.h * scaleY);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(
      img,
      Math.round(crop.x * scaleX),
      Math.round(crop.y * scaleY),
      canvas.width,
      canvas.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    onSubmit(canvas.toDataURL("image/png"));
  };

  const corners = [
    { key: CORNER_KEYS[0], hx: crop.x, hy: crop.y },
    { key: CORNER_KEYS[1], hx: crop.x + crop.w, hy: crop.y },
    { key: CORNER_KEYS[2], hx: crop.x, hy: crop.y + crop.h },
    { key: CORNER_KEYS[3], hx: crop.x + crop.w, hy: crop.y + crop.h },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display">Crop Your Photo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Drag the handles on the crop box to resize, or drag inside to move.
            Press Submit when done.
          </p>
          {/* Crop area */}
          <div
            ref={containerRef}
            className="relative select-none overflow-hidden rounded-xl border border-border cursor-crosshair"
            onMouseDown={onMouseDown}
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              className="w-full block"
              onLoad={onImgLoad}
              draggable={false}
            />
            {/* Overlay SVG */}
            {displaySize.w > 0 && (
              <svg
                role="img"
                aria-label="Crop selection overlay"
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ width: displaySize.w, height: displaySize.h }}
              >
                <title>Crop selection overlay</title>
                <defs>
                  <mask id="crop-mask">
                    <rect width="100%" height="100%" fill="white" />
                    <rect
                      x={crop.x}
                      y={crop.y}
                      width={crop.w}
                      height={crop.h}
                      fill="black"
                    />
                  </mask>
                </defs>
                <rect
                  width="100%"
                  height="100%"
                  fill="rgba(0,0,0,0.55)"
                  mask="url(#crop-mask)"
                />
                {/* Crop border */}
                <rect
                  x={crop.x}
                  y={crop.y}
                  width={crop.w}
                  height={crop.h}
                  fill="none"
                  stroke="white"
                  strokeWidth={2}
                />
                {/* Rule of thirds lines */}
                {[1, 2].map((i) => (
                  <React.Fragment key={i}>
                    <line
                      x1={crop.x + (crop.w / 3) * i}
                      y1={crop.y}
                      x2={crop.x + (crop.w / 3) * i}
                      y2={crop.y + crop.h}
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth={1}
                    />
                    <line
                      x1={crop.x}
                      y1={crop.y + (crop.h / 3) * i}
                      x2={crop.x + crop.w}
                      y2={crop.y + (crop.h / 3) * i}
                      stroke="rgba(255,255,255,0.3)"
                      strokeWidth={1}
                    />
                  </React.Fragment>
                ))}
                {/* Corner handles */}
                {corners.map(({ key, hx, hy }) => (
                  <rect
                    key={key}
                    x={hx - HANDLE / 2}
                    y={hy - HANDLE / 2}
                    width={HANDLE}
                    height={HANDLE}
                    fill="white"
                    stroke="rgba(0,0,0,0.5)"
                    strokeWidth={1}
                    rx={2}
                  />
                ))}
              </svg>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              data-ocid="crop.cancel_button"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={handleSubmit}
              data-ocid="crop.submit_button"
            >
              Submit Crop
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
