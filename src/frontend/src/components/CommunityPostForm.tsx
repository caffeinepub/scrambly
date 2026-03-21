import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, Send, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useCreatePost } from "../hooks/useQueries";

interface CommunityPostFormProps {
  isBanned?: boolean;
}

interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function CommunityPostForm({
  isBanned,
}: CommunityPostFormProps) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<Uint8Array | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const [resizePercent, setResizePercent] = useState(100);
  const [resizedPreview, setResizedPreview] = useState<string | null>(null);
  const [resizedSize, setResizedSize] = useState<number>(0);

  // Crop state
  const [cropMode, setCropMode] = useState(false);
  const [cropBox, setCropBox] = useState<CropBox>({
    x: 10,
    y: 10,
    w: 80,
    h: 80,
  });
  const [dragging, setDragging] = useState<null | {
    type: "move" | "resize";
    startX: number;
    startY: number;
    startBox: CropBox;
  }>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const cropImgRef = useRef<HTMLImageElement>(null);

  // Text overlay state
  const [showTextOverlay, setShowTextOverlay] = useState(false);
  const [textOverlay, setTextOverlay] = useState("");

  // Music state
  const [showMusicOptions, setShowMusicOptions] = useState(false);
  const [musicMode, setMusicMode] = useState<"https" | "file" | null>(null);
  const [musicUrl, setMusicUrl] = useState("");
  const [musicHttpsInput, setMusicHttpsInput] = useState("");
  const musicFileRef = useRef<HTMLInputElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const createPost = useCreatePost();

  // Resize image using canvas when resizePercent or imagePreview changes
  useEffect(() => {
    if (!imagePreview || !imageDimensions) return;
    const img = new Image();
    img.onload = () => {
      const targetW = Math.round((imageDimensions.w * resizePercent) / 100);
      const targetH = Math.round((imageDimensions.h * resizePercent) / 100);
      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, targetW, targetH);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setResizedPreview(dataUrl);
      // Estimate file size from base64
      const base64 = dataUrl.split(",")[1];
      setResizedSize(Math.round((base64.length * 3) / 4 / 1024));
      // Convert to Uint8Array for upload
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          blob.arrayBuffer().then((buf) => setImage(new Uint8Array(buf)));
        },
        "image/jpeg",
        0.85,
      );
    };
    img.src = imagePreview;
  }, [imagePreview, imageDimensions, resizePercent]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      setCropMode(false);
      setResizePercent(100);
      // Load to get dimensions
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ w: img.naturalWidth, h: img.naturalHeight });
        // Reset crop box
        setCropBox({ x: 10, y: 10, w: 80, h: 80 });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const clearImage = () => {
    setImage(null);
    setImagePreview(null);
    setResizedPreview(null);
    setImageDimensions(null);
    setCropMode(false);
    setTextOverlay("");
    setShowTextOverlay(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Apply text overlay to the current resized image
  const applyTextOverlay = useCallback(() => {
    if (!resizedPreview || !textOverlay.trim()) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      ctx.font = `bold ${Math.max(20, img.height * 0.07)}px Arial, sans-serif`;
      ctx.fillStyle = "white";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 3;
      ctx.textAlign = "center";
      const y = img.height * 0.88;
      ctx.strokeText(textOverlay, img.width / 2, y);
      ctx.fillText(textOverlay, img.width / 2, y);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setResizedPreview(dataUrl);
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          blob.arrayBuffer().then((buf) => setImage(new Uint8Array(buf)));
        },
        "image/jpeg",
        0.9,
      );
      toast.success("Text overlay applied!");
    };
    img.src = resizedPreview;
  }, [resizedPreview, textOverlay]);

  // Crop logic — percentage-based crop box
  const applyCrop = useCallback(() => {
    if (!resizedPreview) return;
    const img = new Image();
    img.onload = () => {
      const { x, y, w, h } = cropBox;
      const srcX = (x / 100) * img.width;
      const srcY = (y / 100) * img.height;
      const srcW = (w / 100) * img.width;
      const srcH = (h / 100) * img.height;
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, srcW);
      canvas.height = Math.max(1, srcH);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setResizedPreview(dataUrl);
      setImageDimensions({ w: Math.round(srcW), h: Math.round(srcH) });
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          blob.arrayBuffer().then((buf) => setImage(new Uint8Array(buf)));
        },
        "image/jpeg",
        0.9,
      );
      setCropMode(false);
      toast.success("Crop applied!");
    };
    img.src = resizedPreview;
  }, [resizedPreview, cropBox]);

  // Mouse events for draggable crop box
  const handleCropMouseDown = (
    e: React.MouseEvent,
    type: "move" | "resize",
  ) => {
    e.preventDefault();
    setDragging({
      type,
      startX: e.clientX,
      startY: e.clientY,
      startBox: { ...cropBox },
    });
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const container = cropContainerRef.current;
      const imgEl = cropImgRef.current;
      if (!container || !imgEl) return;
      const rect = imgEl.getBoundingClientRect();
      const dx = ((e.clientX - dragging.startX) / rect.width) * 100;
      const dy = ((e.clientY - dragging.startY) / rect.height) * 100;
      const { x, y, w, h } = dragging.startBox;
      if (dragging.type === "move") {
        setCropBox({
          x: Math.max(0, Math.min(100 - w, x + dx)),
          y: Math.max(0, Math.min(100 - h, y + dy)),
          w,
          h,
        });
      } else {
        setCropBox({
          x,
          y,
          w: Math.max(10, Math.min(100 - x, w + dx)),
          h: Math.max(10, Math.min(100 - y, h + dy)),
        });
      }
    };
    const onUp = () => setDragging(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

  const handleMusicFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = [".ogg", ".wav", ".mp4"];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!allowed.includes(ext)) {
      toast.error("Only .ogg, .wav, and .mp4 audio files are allowed.");
      return;
    }
    const blobUrl = URL.createObjectURL(file);
    setMusicUrl(blobUrl);
    toast.success(`Music file attached: ${file.name}`);
    setShowMusicOptions(false);
    setMusicMode(null);
  };

  const handleMusicHttpsApply = () => {
    if (!musicHttpsInput.startsWith("https://")) {
      toast.error("Please enter a valid HTTPS URL.");
      return;
    }
    setMusicUrl(musicHttpsInput);
    toast.success("Music URL attached!");
    setShowMusicOptions(false);
    setMusicMode(null);
  };

  const handleSubmit = async () => {
    if (!text.trim() && !image) return;

    const bannedKeywords = [
      "porn",
      "anime",
      "hentai",
      "nsfw",
      "explicit",
      "nude",
      "naked",
      "xxx",
      "adult content",
    ];
    const lowerText = text.toLowerCase();
    for (const kw of bannedKeywords) {
      if (lowerText.includes(kw)) {
        toast.error(
          "Your post contains prohibited content and cannot be submitted.",
        );
        return;
      }
    }

    // Append music URL to text if present
    const finalText = musicUrl ? `${text}\n[music:${musicUrl}]` : text;

    try {
      await createPost.mutateAsync({ text: finalText, image });
      setText("");
      clearImage();
      setMusicUrl("");
      setMusicHttpsInput("");
      toast.success("Everyone can see your post.", { duration: 4000 });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create post");
    }
  };

  if (isBanned) return null;

  const displayPreview = resizedPreview || imagePreview;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Image and Text
        </span>
      </div>

      {/* Image editing area */}
      {displayPreview && (
        <div className="mb-3 space-y-2">
          {/* Image dimensions & resize */}
          {imageDimensions && (
            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
              <span>
                📐 {imageDimensions.w}×{imageDimensions.h}px
              </span>
              {resizedSize > 0 && <span>~{resizedSize} KB after resize</span>}
            </div>
          )}

          {/* Resize slider */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-14 shrink-0">
              Resize: {resizePercent}%
            </span>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={resizePercent}
              onChange={(e) => setResizePercent(Number(e.target.value))}
              className="flex-1 accent-primary cursor-pointer"
              aria-label="Resize image"
              data-ocid="post.image.input"
            />
          </div>

          {/* Image preview with optional crop overlay */}
          <div
            ref={cropContainerRef}
            className="relative rounded-lg overflow-hidden border border-border select-none"
          >
            <div className="flex items-center gap-1 px-2 py-1 bg-muted/50">
              <ImageIcon className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Image
              </span>
            </div>
            <div className="relative">
              <img
                ref={cropImgRef}
                src={displayPreview}
                alt="Preview"
                className="max-h-60 w-full object-contain"
                draggable={false}
              />
              {/* Crop overlay */}
              {cropMode && (
                <div className="absolute inset-0" style={{ cursor: "default" }}>
                  {/* Dark overlay outside crop */}
                  <div className="absolute inset-0 bg-black/50 pointer-events-none" />
                  {/* Crop box */}
                  <div
                    className="absolute border-2 border-white shadow-lg"
                    style={{
                      left: `${cropBox.x}%`,
                      top: `${cropBox.y}%`,
                      width: `${cropBox.w}%`,
                      height: `${cropBox.h}%`,
                      cursor: "move",
                      background: "transparent",
                    }}
                    onMouseDown={(e) => handleCropMouseDown(e, "move")}
                  >
                    {/* Clear the dark overlay inside */}
                    <div
                      className="absolute inset-0 bg-transparent"
                      style={{ backdropFilter: "none", mixBlendMode: "normal" }}
                    />
                    {/* Resize handle bottom-right */}
                    <div
                      className="absolute bottom-0 right-0 w-4 h-4 bg-white rounded-tl cursor-se-resize"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleCropMouseDown(e, "resize");
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            {/* Close button */}
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-8 right-2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center hover:bg-background z-10"
              data-ocid="post.image.close_button"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Image editing toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Black Crop button */}
            <button
              type="button"
              onClick={() => setCropMode((v) => !v)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
              style={{
                background: cropMode ? "#333" : "#111",
                border: "2px solid #222",
              }}
              data-ocid="post.image.crop.button"
            >
              ✂ {cropMode ? "Cancel Crop" : "Crop"}
            </button>

            {/* Apply crop button */}
            {cropMode && (
              <button
                type="button"
                onClick={applyCrop}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                data-ocid="post.image.apply_crop.button"
              >
                Apply Crop
              </button>
            )}

            {/* Aa text overlay button */}
            <button
              type="button"
              onClick={() => setShowTextOverlay((v) => !v)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border border-border bg-card hover:bg-muted transition-colors"
              data-ocid="post.image.text_overlay.toggle"
            >
              Aa
            </button>

            {/* Music button */}
            <button
              type="button"
              onClick={() => setShowMusicOptions((v) => !v)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border border-border bg-card hover:bg-muted transition-colors"
              data-ocid="post.music.toggle"
            >
              🎵
            </button>
          </div>

          {/* Text overlay input */}
          {showTextOverlay && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border border-border">
              <input
                type="text"
                value={textOverlay}
                onChange={(e) => setTextOverlay(e.target.value)}
                placeholder="Type text to overlay on image..."
                className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                data-ocid="post.image.text_overlay.input"
              />
              <button
                type="button"
                onClick={applyTextOverlay}
                disabled={!textOverlay.trim()}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Apply
              </button>
            </div>
          )}

          {/* Music options */}
          {showMusicOptions && (
            <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                🎵 Add Music to Post
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMusicMode("https")}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    musicMode === "https"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:bg-muted"
                  }`}
                  data-ocid="post.music.https.button"
                >
                  By HTTPS URL
                </button>
                <button
                  type="button"
                  onClick={() => setMusicMode("file")}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    musicMode === "file"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:bg-muted"
                  }`}
                  data-ocid="post.music.file.button"
                >
                  By File (.ogg, .wav, .mp4)
                </button>
              </div>
              {musicMode === "https" && (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={musicHttpsInput}
                    onChange={(e) => setMusicHttpsInput(e.target.value)}
                    placeholder="https://example.com/audio.ogg"
                    className="flex-1 text-sm px-2 py-1 rounded border border-border bg-background text-foreground outline-none"
                    data-ocid="post.music.url.input"
                  />
                  <button
                    type="button"
                    onClick={handleMusicHttpsApply}
                    className="px-3 py-1 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary/90"
                  >
                    Attach
                  </button>
                </div>
              )}
              {musicMode === "file" && (
                <div>
                  <input
                    ref={musicFileRef}
                    type="file"
                    accept=".ogg,.wav,.mp4,audio/ogg,audio/wav,video/mp4"
                    className="hidden"
                    onChange={handleMusicFile}
                  />
                  <button
                    type="button"
                    onClick={() => musicFileRef.current?.click()}
                    className="w-full px-3 py-2 rounded-lg text-xs font-semibold border border-dashed border-border hover:bg-muted transition-colors text-muted-foreground"
                    data-ocid="post.music.upload_button"
                  >
                    📁 Choose .ogg, .wav, or .mp4 audio file
                  </button>
                  <p className="text-xs text-muted-foreground mt-1">
                    Only .ogg, .wav, and .mp4 audio files are accepted
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Music preview */}
          {musicUrl && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
              <span className="text-xs">🎵 Music attached</span>
              <audio
                controls
                src={musicUrl}
                className="h-7 flex-1"
                preload="metadata"
              >
                <track kind="captions" srcLang="en" label="No captions" />
              </audio>
              <button
                type="button"
                onClick={() => {
                  setMusicUrl("");
                  setMusicHttpsInput("");
                }}
                className="text-xs text-destructive hover:underline shrink-0"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      {/* Text input */}
      {!displayPreview && (
        <div className="mb-3">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Text
            </span>
          </div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share something with the community..."
            rows={3}
            className="resize-none"
            data-ocid="post.textarea"
          />
        </div>
      )}

      {displayPreview && (
        <div className="mb-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a caption..."
            rows={2}
            className="resize-none"
            data-ocid="post.textarea"
          />
        </div>
      )}

      {/* Music option without image */}
      {!displayPreview && (
        <div className="mb-3">
          {!showMusicOptions && (
            <button
              type="button"
              onClick={() => setShowMusicOptions(true)}
              className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              data-ocid="post.music.toggle"
            >
              🎵 Add music to post
            </button>
          )}
          {showMusicOptions && (
            <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground">
                  🎵 Add Music to Post
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowMusicOptions(false);
                    setMusicMode(null);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMusicMode("https")}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    musicMode === "https"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:bg-muted"
                  }`}
                >
                  By HTTPS URL
                </button>
                <button
                  type="button"
                  onClick={() => setMusicMode("file")}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    musicMode === "file"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:bg-muted"
                  }`}
                >
                  By File
                </button>
              </div>
              {musicMode === "https" && (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={musicHttpsInput}
                    onChange={(e) => setMusicHttpsInput(e.target.value)}
                    placeholder="https://example.com/audio.ogg"
                    className="flex-1 text-sm px-2 py-1 rounded border border-border bg-background text-foreground outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleMusicHttpsApply}
                    className="px-3 py-1 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-primary/90"
                  >
                    Attach
                  </button>
                </div>
              )}
              {musicMode === "file" && (
                <div>
                  <input
                    ref={musicFileRef}
                    type="file"
                    accept=".ogg,.wav,.mp4,audio/ogg,audio/wav,video/mp4"
                    className="hidden"
                    onChange={handleMusicFile}
                  />
                  <button
                    type="button"
                    onClick={() => musicFileRef.current?.click()}
                    className="w-full px-3 py-2 rounded-lg text-xs font-semibold border border-dashed border-border hover:bg-muted transition-colors text-muted-foreground"
                  >
                    📁 Choose .ogg, .wav, or .mp4 audio file
                  </button>
                </div>
              )}
            </div>
          )}
          {musicUrl && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20 mt-2">
              <span className="text-xs">🎵 Music attached</span>
              <audio
                controls
                src={musicUrl}
                className="h-7 flex-1"
                preload="metadata"
              >
                <track kind="captions" srcLang="en" label="No captions" />
              </audio>
              <button
                type="button"
                onClick={() => {
                  setMusicUrl("");
                  setMusicHttpsInput("");
                }}
                className="text-xs text-destructive hover:underline shrink-0"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5"
            data-ocid="post.image.upload_button"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            Add Image
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={createPost.isPending || (!text.trim() && !image)}
          size="sm"
          className="gap-1.5"
          data-ocid="post.submit_button"
        >
          {createPost.isPending ? (
            <>Posting...</>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              Post
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
