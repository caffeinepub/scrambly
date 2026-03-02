import React, { useState, useRef } from 'react';
import { useIsCallerBanned, useGetAllPosts, useEditPost, useDeletePost, useReplyToPost, useGetReplies } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import CommunityPostForm from '../components/CommunityPostForm';
import { Post, PostRole } from '../backend';
import { Edit2, Trash2, MessageCircle, Send, X, ImagePlus, ChevronDown, ChevronUp, Eye, AlertOctagon, List } from 'lucide-react';

// ---- Helpers ----

function imageToObjectUrl(imageBytes: Uint8Array): string {
  const blob = new Blob([new Uint8Array(imageBytes.buffer as ArrayBuffer)], { type: 'image/jpeg' });
  return URL.createObjectURL(blob);
}

function formatTime(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleString();
}

// ---- Role Badge ----
function RoleBadge({ role }: { role: PostRole }) {
  if (role === PostRole.admin) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300 ml-1">ADMIN</span>;
  }
  if (role === PostRole.moderator) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300 ml-1">MODERATOR</span>;
  }
  if (role === PostRole.warned) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-300 ml-1">WARNED</span>;
  }
  return null;
}

// ---- Post Image ----
function PostImage({ imageBytes }: { imageBytes: Uint8Array }) {
  const [url, setUrl] = useState<string | null>(null);
  React.useEffect(() => {
    const objectUrl = imageToObjectUrl(imageBytes);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageBytes]);
  if (!url) return null;
  return <img src={url} alt="Post" className="max-h-64 rounded-xl border border-border object-cover mt-2 w-full" />;
}

// ---- Reply Section ----
function ReplySection({ parentId, isReadOnly, currentPrincipal }: {
  parentId: bigint;
  isReadOnly: boolean;
  currentPrincipal: string | null;
}) {
  const { data: replies = [], isLoading } = useGetReplies(parentId);
  const replyToPost = useReplyToPost();
  const editPost = useEditPost();
  const deletePost = useDeletePost();
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
    if (!replyText.trim() && !replyImage) { setReplyError('Please add text or an image.'); return; }
    let imageBytes: Uint8Array | null = null;
    if (replyImage) {
      const buffer = await replyImage.arrayBuffer();
      imageBytes = new Uint8Array(buffer);
    }
    try {
      await replyToPost.mutateAsync({ parentId, text: replyText.trim(), image: imageBytes });
      setReplyText(''); setReplyImage(null); setReplyPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setReplyError(err?.message ?? 'Failed to post reply.');
    }
  };

  return (
    <div className="mt-3 pl-4 border-l-2 border-border space-y-3">
      {isLoading && <div className="text-xs text-muted-foreground">Loading replies...</div>}
      {replies.map((reply) => (
        <ReplyCard key={reply.id.toString()} reply={reply} isReadOnly={isReadOnly} currentPrincipal={currentPrincipal} />
      ))}
      {!isReadOnly && (
        <form onSubmit={handleReply} className="space-y-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {replyPreview && (
            <div className="relative inline-block">
              <img src={replyPreview} alt="Reply preview" className="max-h-32 rounded-lg border border-border object-cover" />
              <button type="button" onClick={() => { setReplyImage(null); setReplyPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"><X className="w-3 h-3" /></button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition"><ImagePlus className="w-4 h-4" /></button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            <button type="submit" disabled={replyToPost.isPending} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition disabled:opacity-50">
              {replyToPost.isPending ? <div className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <Send className="w-3 h-3" />}
              Reply
            </button>
          </div>
          {replyError && <p className="text-xs text-destructive">{replyError}</p>}
        </form>
      )}
    </div>
  );
}

// ---- Reply Card ----
function ReplyCard({ reply, isReadOnly, currentPrincipal }: { reply: Post; isReadOnly: boolean; currentPrincipal: string | null }) {
  const editPost = useEditPost();
  const deletePost = useDeletePost();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(reply.text);
  const [editError, setEditError] = useState('');
  const isAuthor = currentPrincipal !== null && reply.author.toString() === currentPrincipal;

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    try {
      await editPost.mutateAsync({ postId: reply.id, newText: editText.trim(), newImage: reply.image ? new Uint8Array(reply.image.buffer as ArrayBuffer) : null });
      setIsEditing(false);
    } catch (err: any) {
      setEditError(err?.message ?? 'Failed to edit reply.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this reply?')) return;
    try { await deletePost.mutateAsync(reply.id); } catch { /* silent */ }
  };

  return (
    <div className="bg-muted/30 border border-border/50 rounded-lg p-3 text-sm">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center flex-wrap gap-1">
          <span className="font-semibold text-foreground text-xs">{reply.authorUsername}</span>
          <RoleBadge role={reply.authorRole} />
          {reply.edited && <span className="text-xs text-muted-foreground italic">(Edited)</span>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-muted-foreground">{formatTime(reply.timestamp)}</span>
          {isAuthor && !isReadOnly && (
            <>
              <button onClick={() => setIsEditing(!isEditing)} className="p-1 rounded hover:bg-muted transition text-muted-foreground hover:text-foreground"><Edit2 className="w-3 h-3" /></button>
              <button onClick={handleDelete} disabled={deletePost.isPending} className="p-1 rounded hover:bg-destructive/10 transition text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
            </>
          )}
        </div>
      </div>
      {isEditing ? (
        <form onSubmit={handleEdit} className="space-y-2">
          <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2} className="w-full px-2 py-1 rounded border border-border bg-background text-foreground text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary" />
          <div className="flex gap-2">
            <button type="submit" disabled={editPost.isPending} className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs disabled:opacity-50">{editPost.isPending ? 'Saving...' : 'Save'}</button>
            <button type="button" onClick={() => { setIsEditing(false); setEditText(reply.text); }} className="px-2 py-1 bg-muted text-foreground rounded text-xs">Cancel</button>
          </div>
          {editError && <p className="text-xs text-destructive">{editError}</p>}
        </form>
      ) : (
        <>
          {reply.text && <p className="text-foreground text-xs leading-relaxed">{reply.text}</p>}
          {reply.image && <PostImage imageBytes={reply.image} />}
        </>
      )}
    </div>
  );
}

// ---- Post Card ----
function PostCard({ post, isReadOnly, currentPrincipal }: { post: Post; isReadOnly: boolean; currentPrincipal: string | null }) {
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
      imageBytes = new Uint8Array(post.image.buffer as ArrayBuffer);
    }
    try {
      await editPost.mutateAsync({ postId: post.id, newText: editText.trim(), newImage: imageBytes });
      setIsEditing(false); setEditImage(null); setEditPreview(null);
    } catch (err: any) {
      setEditError(err?.message ?? 'Failed to edit post.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post? Everyone will no longer see it.')) return;
    try { await deletePost.mutateAsync(post.id); } catch { /* silent */ }
  };

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
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center flex-wrap gap-1">
          <span className="font-semibold text-foreground">{post.authorUsername}</span>
          <RoleBadge role={post.authorRole} />
          {post.edited && <span className="text-xs text-muted-foreground italic ml-1">(Edited)</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">{formatTime(post.timestamp)}</span>
          {isAuthor && !isReadOnly && (
            <>
              <button onClick={() => setIsEditing(!isEditing)} className="p-1 rounded hover:bg-muted transition text-muted-foreground hover:text-foreground" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={handleDelete} disabled={deletePost.isPending} className="p-1 rounded hover:bg-destructive/10 transition text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleEdit} className="space-y-2 mt-2">
          <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary" />
          {(editPreview || existingImagePreviewUrl) && (
            <div className="relative inline-block">
              <img src={editPreview ?? existingImagePreviewUrl ?? ''} alt="Edit preview" className="max-h-32 rounded-lg border border-border object-cover" />
              <button type="button" onClick={() => { setEditImage(null); setEditPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"><X className="w-3 h-3" /></button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition"><ImagePlus className="w-4 h-4" /></button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleEditImageChange} className="hidden" />
            <button type="submit" disabled={editPost.isPending} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition disabled:opacity-50">{editPost.isPending ? 'Saving...' : 'Save'}</button>
            <button type="button" onClick={() => { setIsEditing(false); setEditText(post.text); setEditImage(null); setEditPreview(null); }} className="px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs font-medium hover:opacity-90 transition">Cancel</button>
          </div>
          {editError && <p className="text-xs text-destructive">{editError}</p>}
        </form>
      ) : (
        <>
          {post.text && <p className="text-foreground text-sm leading-relaxed">{post.text}</p>}
          {post.image && <PostImage imageBytes={post.image} />}
        </>
      )}

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

      {showReplies && (
        <ReplySection parentId={post.id} isReadOnly={isReadOnly} currentPrincipal={currentPrincipal} />
      )}
    </div>
  );
}

// ---- Ban Screen ----
function BanScreen({ onView }: { onView: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <div className="max-w-md w-full bg-card border border-destructive/30 rounded-2xl shadow-2xl p-8 text-center">
        <AlertOctagon className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">You Are Banned</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Your account has been banned from Scrambly. You can still view posts in read-only mode, or submit an appeal.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onView}
            className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition"
          >
            <Eye className="w-5 h-5" />
            View Posts (Read Only)
          </button>
          <a
            href="/appeal"
            className="flex items-center justify-center gap-2 w-full py-3 bg-muted text-foreground rounded-xl font-semibold hover:bg-muted/80 transition"
          >
            Appeal My Ban
          </a>
        </div>
      </div>
    </div>
  );
}

// ---- Main Community Page ----
export default function CommunityPage() {
  const { identity } = useInternetIdentity();
  const currentPrincipal = identity?.getPrincipal().toString() ?? null;
  const { data: isBanned, isLoading: banLoading } = useIsCallerBanned();
  const { data: posts = [], isLoading: postsLoading, error: postsError } = useGetAllPosts();

  const [banScreenDismissed, setBanScreenDismissed] = useState(false);
  const [showAppealScreen, setShowAppealScreen] = useState(false);
  const [showAllPosts, setShowAllPosts] = useState(false);

  const isReadOnly = !!isBanned;

  if (banLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  // Show ban screen if banned and not dismissed (or appeal screen re-shown)
  if (isBanned && (!banScreenDismissed || showAppealScreen)) {
    return (
      <BanScreen onView={() => { setBanScreenDismissed(true); setShowAppealScreen(false); }} />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Community</h1>
              <p className="text-muted-foreground text-sm mt-1">Share and connect with the Scrambly community</p>
            </div>
            {isBanned && banScreenDismissed && (
              <button
                onClick={() => setShowAppealScreen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive border border-destructive/30 rounded-xl text-sm font-medium hover:bg-destructive/20 transition"
              >
                <AlertOctagon className="w-4 h-4" />
                AppealMe
              </button>
            )}
          </div>
        </div>

        {/* Post Form — hidden for banned users */}
        {!isReadOnly && <CommunityPostForm isBanned={false} />}

        {isReadOnly && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mb-6 text-sm text-destructive font-medium text-center">
            You are banned. You can only view posts.
          </div>
        )}

        {/* View All Posts Button */}
        <div className="mt-6 mb-4">
          <button
            onClick={() => setShowAllPosts(!showAllPosts)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition shadow-sm"
          >
            <List className="w-5 h-5" />
            {showAllPosts ? 'Hide Posts' : 'View All Posts'}
          </button>
        </div>

        {/* Posts Feed */}
        {showAllPosts && (
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            {postsLoading && (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/4 mb-3" />
                    <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            )}
            {postsError && (
              <div className="text-center py-8 text-destructive text-sm">
                Failed to load posts. Please try again.
              </div>
            )}
            {!postsLoading && !postsError && posts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No posts yet. Be the first to share something!</p>
              </div>
            )}
            {!postsLoading && !postsError && posts.map((post: Post) => (
              <PostCard
                key={post.id.toString()}
                post={post}
                isReadOnly={isReadOnly}
                currentPrincipal={currentPrincipal}
              />
            ))}
          </div>
        )}

        {/* Community Guidelines */}
        <div className="mt-8 bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-2 text-sm">Community Guidelines</h3>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Be kind and respectful to everyone</li>
            <li>No inappropriate content, images, or language</li>
            <li>Keep posts Sonic-related and fun</li>
            <li>Violations may result in warnings or bans</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
