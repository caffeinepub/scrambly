import React, { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useCreateCommunityPost } from "../hooks/useQueries";

const BANNED_KEYWORDS = [
  "porn",
  "anime",
  "inappropriate anime",
  "hentai",
  "nsfw",
  "explicit",
  "nude",
  "naked",
  "xxx",
  "adult content",
];

function containsBannedContent(message: string): boolean {
  const lower = message.toLowerCase();
  return BANNED_KEYWORDS.some((kw) => lower.includes(kw));
}

interface CommunityPostFormProps {
  onPostCreated?: () => void;
}

export default function CommunityPostForm({ onPostCreated }: CommunityPostFormProps) {
  const [message, setMessage] = useState("");
  const createPost = useCreateCommunityPost();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error("Please write something before posting.");
      return;
    }

    // Client-side banned content check — instant ban trigger
    if (containsBannedContent(message)) {
      toast.error(
        "🚫 Your post contains prohibited content. Posting anime images, pornographic material, or inappropriate terms results in an instant ban.",
        { duration: 6000 }
      );
      // Do NOT submit the post
      return;
    }

    try {
      await createPost.mutateAsync(message.trim());
      setMessage("");
      toast.success("Post shared! 🎉");
      onPostCreated?.();
    } catch (e: any) {
      const errorMsg: string = e?.message || String(e) || "";
      if (errorMsg.toLowerCase().includes("banned") || errorMsg.toLowerCase().includes("locked")) {
        toast.error(
          "🚫 Your account has been banned for posting prohibited content.",
          { duration: 8000 }
        );
      } else {
        toast.error(`Failed to post: ${errorMsg}`);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder="Share something Sonic-related with the community! 🦔"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        maxLength={500}
        className="resize-none"
        disabled={createPost.isPending}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{message.length}/500</span>
        <Button type="submit" disabled={createPost.isPending || !message.trim()} size="sm">
          {createPost.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Post
        </Button>
      </div>
    </form>
  );
}
