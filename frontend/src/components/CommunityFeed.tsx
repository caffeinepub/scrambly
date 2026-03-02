import React, { useState, useRef } from 'react';
import { Post, PostRole } from '../backend';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetReplies, useEditPost, useDeletePost, useReplyToPost, useGetAllPosts } from '../hooks/useQueries';
import { Edit2, Trash2, MessageCircle, Send, X, ImagePlus, ChevronDown, ChevronUp } from 'lucide-react';

interface PostCardProps {
  post: Post;
  isReadOnly: boolean;
  currentPrincipal: string | null;
  depth?: number;
}

function RoleBadge({ role }: { role: PostRole }) {
  if (role === PostRole.admin) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300 ml-1">
        ADMIN
      </span>
    );
  }
  if (role === PostRole.moderator) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300 ml-1">
        MODERATOR
      </span>
    );
  }
  if (role === PostRole.warned) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-300 ml-1">
        WARNED
      </span>
    );
  }
  return null;
}

function formatTime(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleString();
}

function imageToObjectUrl(imageBytes: Uint8Array): string {
  // Cast buffer to ArrayBuffer to satisfy strict BlobPart typing
  const blob = new Blob([new Uint8Array(imageBytes.buffer as ArrayBuffer)], { type: 'image/jpeg' });
  return URL.createObjectURL(blob);
}

function PostImage({ imageBytes }: { imageBytes: Uint8Array }) {
  const [url, setUrl] = useState<string | null>(null);

  React.useEffect(() => {
    const objectUrl = imageToObjectUrl(imageBytes);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageBytes]);

  if (!url) return null;
  return (
    <img
      src={url}
      alt="Post image"
      className="max-h-64 rounded-xl border border-border object-cover mt-2"
    />
  );
}

function ReplySection({ parentId, isReadOnly, currentPrincipal }: {
  parentId: bigint;
  isReadOnly: boolean;
  currentPrincipal: string | null;
}) {
  const { data: replies = [], isLoading } = useGetReplies(parentId);
  const replyToPost = useReplyToPost();
  const [replyText, setReplyText] = useState('');
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [replyPreview, setReplyPreview] = useState<string | null>(null);
  const [replyError, setReplyError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReplyImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setReplyPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setReplyError('');
    if (!replyText.trim() && !replyImage) {
      setReplyError('Please add text or an image.');
      return;
    }
    let imageBytes: Uint8Array | null = null;
    if (replyImage) {
      const buffer = await replyImage.arrayBuffer();
      imageBytes = new Uint8Array(buffer);
    }
    try {
      await replyToPost.mutateAsync({ parentId, text: replyText.trim(), image: imageBytes });
      setReplyText('');
      setReplyImage(null);
      setReplyPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setReplyError(err?.message ?? 'Failed to post reply.');
    }
  };

  return (
    <div className="mt-3 pl-4 border-l-2 border-border space-y-3">
      {isLoading && <div className="text-xs text-muted-foreground">Loading replies...</div>}
      {replies.map((reply) => (
        <PostCard
          key={reply.id.toString()}
          post={reply}
          isReadOnly={isReadOnly}
          currentPrincipal={currentPrincipal}
          depth={1}
        />
      ))}
      {!isReadOnly && (
        <form onSubmit={handleReply} className="space-y-2">
          <div className="flex gap-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              rows={2}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {replyPreview && (
            <div className="relative inline-block">
              <img src={replyPreview} alt="Reply preview" className="max-h-32 rounded-lg border border-border object-cover" />
              <button
                type="button"
                onClick={() => {
                  setReplyImage(null);
                  setReplyPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition"
            >
              <ImagePlus className="w-4 h-4" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            <button
              type="submit"
              disabled={replyToPost.isPending}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {replyToPost.isPending ? (
                <div className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              Reply
            </button>
          </div>
          {replyError && <p className="text-xs text-destructive">{replyError}</p>}
        </form>
      )}
    </div>
  );
}

function PostCard({ post, isReadOnly, currentPrincipal, depth = 0 }: PostCardProps) {
  const editPost = useEditPost();
  const deletePost = useDeletePost();
  const [showReplies, setShowReplies] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [editError, setEditError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAuthor = currentPrincipal !== null && post.author.toString() === currentPrincipal;

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => setEditPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    let imageBytes: Uint8Array | null = null;
    if (editImage) {
      const buffer = await editImage.arrayBuffer();
      imageBytes = new Uint8Array(buffer);
    } else if (post.image) {
      imageBytes = post.image;
    }
    try {
      await editPost.mutateAsync({ postId: post.id, newText: editText.trim(), newImage: imageBytes });
      setIsEditing(false);
      setEditImage(null);
      setEditPreview(null);
    } catch (err: any) {
      setEditError(err?.message ?? 'Failed to edit post.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await deletePost.mutateAsync(post.id);
    } catch {
      // silently fail
    }
  };

  // Compute a stable preview URL for the existing post image when editing
  const existingImagePreviewUrl = React.useMemo(() => {
    if (!post.image || editPreview) return null;
    return imageToObjectUrl(post.image);
  }, [post.image, editPreview]);

  React.useEffect(() => {
    return () => {
      if (existingImagePreviewUrl) URL.revokeObjectURL(existingImagePreviewUrl);
    };
  }, [existingImagePreviewUrl]);

  return (
    <div className={`bg-card border border-border rounded-xl p-4 ${depth > 0 ? 'text-sm' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center flex-wrap gap-1">
          <span className="font-semibold text-foreground">{post.authorUsername}</span>
          <RoleBadge role={post.authorRole} />
          {post.edited && (
            <span className="text-xs text-muted-foreground italic ml-1">(Edited)</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">{formatTime(post.timestamp)}</span>
          {isAuthor && !isReadOnly && (
            <>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-1 rounded hover:bg-muted transition text-muted-foreground hover:text-foreground"
                title="Edit"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDelete}
                disabled={deletePost.isPending}
                className="p-1 rounded hover:bg-destructive/10 transition text-muted-foreground hover:text-destructive"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <form onSubmit={handleEdit} className="space-y-2 mt-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {(editPreview || existingImagePreviewUrl) && (
            <div className="relative inline-block">
              <img
                src={editPreview ?? existingImagePreviewUrl ?? ''}
                alt="Edit preview"
                className="max-h-32 rounded-lg border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setEditImage(null);
                  setEditPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition"
            >
              <ImagePlus className="w-4 h-4" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleEditImageChange} className="hidden" />
            <button
              type="submit"
              disabled={editPost.isPending}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {editPost.isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditText(post.text);
                setEditImage(null);
                setEditPreview(null);
              }}
              className="px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs font-medium hover:opacity-90 transition"
            >
              Cancel
            </button>
          </div>
          {editError && <p className="text-xs text-destructive">{editError}</p>}
        </form>
      ) : (
        <>
          {post.text && <p className="text-foreground text-sm leading-relaxed">{post.text}</p>}
          {post.image && <PostImage imageBytes={post.image} />}
        </>
      )}

      {/* Reply button (only for top-level posts) */}
      {depth === 0 && (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Reply
            {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      )}

      {/* Replies */}
      {depth === 0 && showReplies && (
        <ReplySection
          parentId={post.id}
          isReadOnly={isReadOnly}
          currentPrincipal={currentPrincipal}
        />
      )}
    </div>
  );
}

interface CommunityFeedProps {
  isReadOnly?: boolean;
}

export default function CommunityFeed({ isReadOnly = false }: CommunityFeedProps) {
  const { identity } = useInternetIdentity();
  const currentPrincipal = identity?.getPrincipal().toString() ?? null;
  const { data: posts = [], isLoading, error } = useGetAllPosts();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4 mb-3" />
            <div className="h-3 bg-muted rounded w-3/4 mb-2" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive text-sm">
        Failed to load posts. Please try again.
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No posts yet. Be the first to share something!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post: Post) => (
        <PostCard
          key={post.id.toString()}
          post={post}
          isReadOnly={isReadOnly}
          currentPrincipal={currentPrincipal}
        />
      ))}
    </div>
  );
}
