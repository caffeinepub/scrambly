import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  MessageSquare,
  Pencil,
  Trash2,
  Type,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { type Post, PostRole } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDeletePost,
  useEditPost,
  useGetReplies,
  useReplyToPost,
} from "../hooks/useQueries";
import ImageViewerModal from "./ImageViewerModal";

interface CommunityFeedProps {
  posts: Post[];
  currentUserPrincipal: string;
  isBanned?: boolean;
}

function RoleBadge({ role }: { role: PostRole }) {
  if (role === PostRole.admin) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-red-600 text-white ml-1">
        ADMIN
      </span>
    );
  }
  if (role === PostRole.moderator) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-blue-600 text-white ml-1">
        MODERATOR
      </span>
    );
  }
  if (role === PostRole.warned) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-yellow-500 text-black ml-1">
        WARNED
      </span>
    );
  }
  return null;
}

function formatTime(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  const date = new Date(ms);
  return date.toLocaleString();
}

/** Parse [music:URL] tag from post text, return {text, musicUrl} */
function parseMusicTag(rawText: string): {
  displayText: string;
  musicUrl: string | null;
} {
  const match = rawText.match(/\[music:([^\]]+)\]/);
  if (match) {
    return {
      displayText: rawText.replace(match[0], "").trim(),
      musicUrl: match[1],
    };
  }
  return { displayText: rawText, musicUrl: null };
}

function PostImage({ imageBytes }: { imageBytes: Uint8Array }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const blob = new Blob([new Uint8Array(imageBytes.buffer as ArrayBuffer)], {
    type: "image/jpeg",
  });
  const url = URL.createObjectURL(blob);

  return (
    <div className="mb-3">
      <div className="flex items-center gap-1 mb-1">
        <ImageIcon className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Image
        </span>
        <span className="text-xs text-muted-foreground ml-1">
          (tap to view fullscreen)
        </span>
      </div>
      <button
        type="button"
        className="block w-full p-0 border-0 bg-transparent cursor-pointer"
        onClick={() => setViewerOpen(true)}
        aria-label="View image fullscreen"
        data-ocid="post.image.canvas_target"
      >
        <img
          src={url}
          alt="Attached media"
          className="rounded-lg max-h-64 w-full object-cover border border-border hover:opacity-90 transition-opacity"
          onLoad={() => URL.revokeObjectURL(url)}
        />
      </button>
      <ImageViewerModal
        imageUrl={url}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        altText="Post image"
      />
    </div>
  );
}

interface ReplyThreadProps {
  parentId: bigint;
  currentUserPrincipal: string;
  isBanned?: boolean;
}

function ReplyThread({
  parentId,
  currentUserPrincipal,
  isBanned,
}: ReplyThreadProps) {
  const { data: replies = [], isLoading } = useGetReplies(parentId);
  const deletePost = useDeletePost();
  const editPost = useEditPost();
  const replyToPost = useReplyToPost();

  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [editText, setEditText] = useState("");
  const [editImage, setEditImage] = useState<Uint8Array | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyImage, setReplyImage] = useState<Uint8Array | null>(null);
  const [showReplyForm, setShowReplyForm] = useState(false);

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: Uint8Array | null) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const arr = new Uint8Array(ev.target?.result as ArrayBuffer);
      setter(arr);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleEditSave = async (replyId: bigint) => {
    try {
      await editPost.mutateAsync({
        postId: replyId,
        newText: editText,
        newImage: editImage,
      });
      setEditingId(null);
      toast.success("Reply updated!");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to edit reply");
    }
  };

  const handleDelete = async (replyId: bigint) => {
    try {
      await deletePost.mutateAsync(replyId);
      toast.success("Reply deleted");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete reply");
    }
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;
    try {
      await replyToPost.mutateAsync({
        parentId,
        text: replyText,
        image: replyImage,
      });
      setReplyText("");
      setReplyImage(null);
      setShowReplyForm(false);
      toast.success("Reply posted!");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to post reply");
    }
  };

  if (isLoading) {
    return (
      <div className="ml-6 mt-2 text-xs text-muted-foreground">
        Loading replies...
      </div>
    );
  }

  return (
    <div className="mt-3 border-l-2 border-border pl-4 space-y-3">
      {replies.map((reply) => {
        const isAuthor = reply.author.toString() === currentUserPrincipal;
        const isEditing = editingId === reply.id;
        const { displayText, musicUrl } = parseMusicTag(reply.text);

        return (
          <div key={reply.id.toString()} className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-semibold text-sm text-foreground">
                {reply.authorUsername}
              </span>
              <RoleBadge role={reply.authorRole} />
              {reply.edited && (
                <span className="text-xs text-muted-foreground italic">
                  • Edited
                </span>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                {formatTime(reply.timestamp)}
              </span>
            </div>

            {reply.image && <PostImage imageBytes={reply.image} />}

            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="text-sm"
                  rows={2}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, setEditImage)}
                  className="text-xs"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleEditSave(reply.id)}
                    disabled={editPost.isPending}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-1">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Type className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      Text
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{displayText}</p>
                  {musicUrl && (
                    <div className="mt-2">
                      <audio
                        controls
                        src={musicUrl}
                        className="w-full h-8 rounded"
                        preload="metadata"
                      >
                        <track
                          kind="captions"
                          srcLang="en"
                          label="No captions"
                        />
                        Your browser does not support audio.
                      </audio>
                    </div>
                  )}
                </div>
                {!isBanned && isAuthor && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        setEditingId(reply.id);
                        setEditText(reply.text);
                        setEditImage(reply.image ?? null);
                      }}
                    >
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Reply?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove your reply from
                            everyone's view.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(reply.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* Reply form */}
      {!isBanned && (
        <div className="mt-2">
          {showReplyForm ? (
            <div className="space-y-2 bg-muted/20 rounded-lg p-3">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="text-sm"
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  📎 Add image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageChange(e, setReplyImage)}
                  />
                </label>
                {replyImage && (
                  <span className="text-xs text-green-600">Image selected</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleReplySubmit}
                  disabled={replyToPost.isPending || !replyText.trim()}
                >
                  {replyToPost.isPending ? "Posting..." : "Post Reply"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyText("");
                    setReplyImage(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowReplyForm(true)}
            >
              <MessageSquare className="w-3 h-3 mr-1" /> Reply
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface PostCardProps {
  post: Post;
  currentUserPrincipal: string;
  isBanned?: boolean;
}

function PostCard({ post, currentUserPrincipal, isBanned }: PostCardProps) {
  const deletePost = useDeletePost();
  const editPost = useEditPost();

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);
  const [editImage, setEditImage] = useState<Uint8Array | null>(
    post.image ?? null,
  );
  const [showReplies, setShowReplies] = useState(false);

  const isAuthor = post.author.toString() === currentUserPrincipal;
  const { displayText, musicUrl } = parseMusicTag(post.text);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEditImage(new Uint8Array(ev.target?.result as ArrayBuffer));
    };
    reader.readAsArrayBuffer(file);
  };

  const handleEditSave = async () => {
    try {
      await editPost.mutateAsync({
        postId: post.id,
        newText: editText,
        newImage: editImage,
      });
      setIsEditing(false);
      toast.success("Post updated! Everyone can see the changes.");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to edit post");
    }
  };

  const handleDelete = async () => {
    try {
      await deletePost.mutateAsync(post.id);
      toast.success("Post deleted");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to delete post");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="p-4">
        {/* Author row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            {post.authorUsername.charAt(0).toUpperCase()}
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-semibold text-sm text-foreground">
              {post.authorUsername}
            </span>
            <RoleBadge role={post.authorRole} />
            {post.edited && (
              <span className="text-xs text-muted-foreground italic ml-1">
                • Edited
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground ml-auto">
            {formatTime(post.timestamp)}
          </span>
        </div>

        {/* Post content */}
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
            />
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                📎 Change image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
              {editImage && (
                <span className="text-xs text-green-600">Image ready</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleEditSave}
                disabled={editPost.isPending}
              >
                {editPost.isPending ? "Saving..." : "Save"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  setEditText(post.text);
                  setEditImage(post.image ?? null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Image section */}
            {post.image && <PostImage imageBytes={post.image} />}

            {/* Text section */}
            <div className="mb-3">
              <div className="flex items-center gap-1 mb-1">
                <Type className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Text
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {displayText}
              </p>
              {/* Music player */}
              {musicUrl && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">
                    🎵 Music attached:
                  </p>
                  <audio
                    controls
                    src={musicUrl}
                    className="w-full rounded"
                    preload="metadata"
                  >
                    <track kind="captions" srcLang="en" label="No captions" />
                    Your browser does not support audio.
                  </audio>
                </div>
              )}
            </div>
          </>
        )}

        {/* Action buttons */}
        {!isEditing && (
          <div className="flex items-center gap-2 pt-2 border-t border-border/50 flex-wrap">
            {/* Reply toggle */}
            {!isBanned && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => setShowReplies(!showReplies)}
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Reply
                {showReplies ? (
                  <ChevronUp className="w-3 h-3 ml-1" />
                ) : (
                  <ChevronDown className="w-3 h-3 ml-1" />
                )}
              </Button>
            )}

            {/* View replies button for banned users */}
            {isBanned && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => setShowReplies(!showReplies)}
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                View Replies
                {showReplies ? (
                  <ChevronUp className="w-3 h-3 ml-1" />
                ) : (
                  <ChevronDown className="w-3 h-3 ml-1" />
                )}
              </Button>
            )}

            {/* Edit/Delete for author only, not banned */}
            {!isBanned && isAuthor && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    setIsEditing(true);
                    setEditText(post.text);
                    setEditImage(post.image ?? null);
                  }}
                >
                  <Pencil className="w-3 h-3 mr-1" /> Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Post?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently remove your post from everyone's
                        view. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        )}
      </div>

      {/* Reply thread */}
      {showReplies && (
        <div className="px-4 pb-4">
          <ReplyThread
            parentId={post.id}
            currentUserPrincipal={currentUserPrincipal}
            isBanned={isBanned}
          />
        </div>
      )}
    </div>
  );
}

export default function CommunityFeed({
  posts,
  currentUserPrincipal,
  isBanned,
}: CommunityFeedProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-lg font-medium">No posts yet</p>
        <p className="text-sm">
          Be the first to share something with the community!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id.toString()}
          post={post}
          currentUserPrincipal={currentUserPrincipal}
          isBanned={isBanned}
        />
      ))}
    </div>
  );
}
