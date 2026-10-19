"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ImagePlus, Link2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { engageBoardFeedService } from "@/services/engageboard-feed.service";
import type {
  ComposeAttachment,
  PostType,
  PostVisibility,
} from "@/types/engageboard-feed.types";

/**
 * POST /engageboard/feed/posts (StoreCompanyPostRequest). Body is plain text
 * wrapped in a single `<p>` tag before submission — HTMLPurifier's allow-list
 * (FeedService::sanitizeHtml()) accepts `p`, so this always survives
 * sanitization untouched; a full rich-text toolbar was judged out of scope
 * for a "dense/enterprise, not consumer" post composer (03-design-system.md
 * §5) — see 20c-integration-snippet.md.
 */
export default function ComposePostPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [postType, setPostType] = useState<PostType>("custom");
  const [visibility, setVisibility] = useState<PostVisibility>("company_wide");
  const [allowComments, setAllowComments] = useState(true);
  const [allowReactions, setAllowReactions] = useState(true);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const createMutation = useMutation({
    mutationFn: engageBoardFeedService.create,
    onSuccess: () => {
      toast.success("Post created successfully.");
      queryClient.invalidateQueries({ queryKey: ["engageboard", "feed"] });
      router.push("/engageboard/feed");
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not create this post. Please try again.";
      toast.error(message);
    },
  });

  const handleSubmit = () => {
    if (!body.trim()) {
      toast.error("Write something before posting.");
      return;
    }

    const attachments: ComposeAttachment[] = [];
    if (imageFile) attachments.push({ type: "image", file: imageFile });
    if (linkUrl.trim()) attachments.push({ type: "link", link_url: linkUrl.trim() });

    createMutation.mutate({
      post_type: postType,
      title: title.trim() || undefined,
      body: `<p>${body.trim().replace(/\n/g, "<br />")}</p>`,
      visibility,
      allow_comments: allowComments,
      allow_reactions: allowReactions,
      attachments: attachments.length ? attachments : undefined,
    });
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div>
        <nav className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
          EngageBoard · Company Feed
        </nav>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-900">New post</h1>
        <p className="text-sm text-gray-500">Share an update, achievement, or announcement.</p>
      </div>

      <Card className="gap-4 p-5">
        <div className="flex flex-col gap-1.5">
          <Label>Post type</Label>
          <Select value={postType} onValueChange={(v) => setPostType(v as PostType)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">General</SelectItem>
              <SelectItem value="announcement">Announcement</SelectItem>
              <SelectItem value="achievement">Achievement</SelectItem>
              <SelectItem value="celebration">Celebration</SelectItem>
              <SelectItem value="news">News</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Title (optional)</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Message</Label>
          <Textarea
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What's happening?"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-500">
            <ImagePlus className="h-4 w-4" />
            {imageFile ? imageFile.name : "Add image"}
            <input
              type="file"
              accept="image/*,.gif"
              className="hidden"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {imageFile && (
            <button type="button" onClick={() => setImageFile(null)} className="text-gray-400">
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <Link2 className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="https://…"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="h-8 w-56 text-xs"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Visibility</Label>
          <Select value={visibility} onValueChange={(v) => setVisibility(v as PostVisibility)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="company_wide">Company-wide</SelectItem>
              <SelectItem value="department">My department</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allowComments}
              onChange={(e) => setAllowComments(e.target.checked)}
            />
            Allow comments
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allowReactions}
              onChange={(e) => setAllowReactions(e.target.checked)}
            />
            Allow reactions
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.push("/engageboard/feed")}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Posting…" : "Post"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
