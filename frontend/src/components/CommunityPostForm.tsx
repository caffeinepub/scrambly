import React, { useState } from 'react';
import { useCreateCommunityPost } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Lock } from 'lucide-react';
import { toast } from 'sonner';
import type { Profile } from '../backend';

interface CommunityPostFormProps {
  profile: Profile | null | undefined;
}

export default function CommunityPostForm({ profile }: CommunityPostFormProps) {
  const [message, setMessage] = useState('');
  const createPost = useCreateCommunityPost();

  if (profile?.accountLocked) {
    return (
      <div className="sonic-card p-4 flex items-center gap-3 text-destructive">
        <Lock size={20} />
        <p className="font-nunito text-sm">Your account is locked. You cannot post.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await createPost.mutateAsync(message.trim());
      setMessage('');
      toast.success('Post shared with the community!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to post';
      toast.error(msg.includes('locked') ? 'Your account is locked.' : 'Failed to post. Try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="sonic-card p-4 space-y-3">
      <Textarea
        placeholder="Share something with the Sonic community... 🦔"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="rounded-xl font-nunito resize-none"
        rows={3}
        maxLength={500}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-nunito">{message.length}/500</span>
        <Button
          type="submit"
          disabled={createPost.isPending || !message.trim()}
          className="rounded-full font-fredoka bg-primary text-primary-foreground"
        >
          <Send size={14} className="mr-1" />
          {createPost.isPending ? 'Posting...' : 'Post'}
        </Button>
      </div>
    </form>
  );
}
