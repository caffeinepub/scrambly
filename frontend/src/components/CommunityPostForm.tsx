import React, { useState, useRef } from 'react';
import { useCreatePost } from '../hooks/useQueries';
import { ImagePlus, Send, X } from 'lucide-react';

interface CommunityPostFormProps {
  isBanned?: boolean;
}

const BANNED_KEYWORDS = ['porn', 'anime', 'inappropriate anime', 'hentai', 'nsfw', 'explicit', 'nude', 'naked', 'xxx', 'adult content'];

export default function CommunityPostForm({ isBanned = false }: CommunityPostFormProps) {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createPost = useCreatePost();

  const containsBannedContent = (msg: string) => {
    const lower = msg.toLowerCase();
    return BANNED_KEYWORDS.some(kw => lower.includes(kw));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!text.trim() && !imageFile) {
      setError('Please add some text or an image before posting.');
      return;
    }

    if (containsBannedContent(text)) {
      setError('Your post contains prohibited content. Your account may be banned.');
      return;
    }

    let imageBytes: Uint8Array | null = null;
    if (imageFile) {
      const buffer = await imageFile.arrayBuffer();
      imageBytes = new Uint8Array(buffer);
    }

    try {
      await createPost.mutateAsync({ text: text.trim(), image: imageBytes });
      setText('');
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSuccessMsg('Your post is now visible to everyone!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      if (msg.includes('banned')) {
        setError('Your account has been banned. You cannot post.');
      } else {
        setError(msg || 'Failed to submit post. Please try again.');
      }
    }
  };

  if (isBanned) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <h3 className="text-base font-semibold text-foreground mb-3">Share something with the community</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setError(''); setSuccessMsg(''); }}
          placeholder="What's on your mind?"
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />

        {imagePreview && (
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" className="max-h-48 rounded-xl border border-border object-cover" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition text-sm"
            >
              <ImagePlus className="w-4 h-4" />
              <span>Add Photo</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          <button
            type="submit"
            disabled={createPost.isPending}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 text-sm"
          >
            {createPost.isPending ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Post
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center">Image and Text</p>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-2 text-sm">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-success/10 border border-success/30 text-success rounded-lg px-4 py-2 text-sm font-medium">
            ✓ {successMsg}
          </div>
        )}
      </form>
    </div>
  );
}
