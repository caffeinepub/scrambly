import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, Send, X } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useCreatePost } from "../hooks/useQueries";

interface CommunityPostFormProps {
  isBanned?: boolean;
}

export default function CommunityPostForm({
  isBanned,
}: CommunityPostFormProps) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<Uint8Array | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createPost = useCreatePost();

  if (isBanned) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const arr = new Uint8Array(ev.target?.result as ArrayBuffer);
      setImage(arr);
      setImagePreview(URL.createObjectURL(file));
    };
    reader.readAsArrayBuffer(file);
  };

  const clearImage = () => {
    setImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!text.trim() && !image) return;

    // Client-side banned keyword check
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

    try {
      await createPost.mutateAsync({ text, image });
      setText("");
      clearImage();
      toast.success("Everyone can see your post.", { duration: 4000 });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to create post");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Image and Text
        </span>
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="relative mb-3 rounded-lg overflow-hidden border border-border">
          <div className="flex items-center gap-1 px-2 py-1 bg-muted/50">
            <ImageIcon className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Image
            </span>
          </div>
          <img
            src={imagePreview}
            alt="Preview"
            className="max-h-48 w-full object-cover"
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-8 right-2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center hover:bg-background"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Text input */}
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
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5"
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
