import { useState } from "react";
import type { CommentDto } from "@/types/comment.types";
import { formatRelativeTime } from "@/utils/format";
import { Heart, MessageSquare, MoreVertical, Pin, Edit2, Trash2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CommentInput } from "./CommentInput";
import { ReplyList } from "./ReplyList";
import { useAuthStore } from "@/store/authStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CommentItemProps {
  comment: CommentDto;
  onLike: (id: number) => void;
  onReply: (parentId: number, content: string) => Promise<void>;
  onEdit: (id: number, content: string) => Promise<void>;
  onDelete: (id: number) => void;
  isReply?: boolean;
}

export function CommentItem({
  comment,
  onLike,
  onReply,
  onEdit,
  onDelete,
  isReply = false,
}: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const { user } = useAuthStore();

  const isOwner = user?.id === comment.user.id;
  const isAdmin = user?.role === "ADMIN";

  const handleReplySubmit = async (content: string) => {
    await onReply(comment.id, content);
    setIsReplying(false);
    setShowReplies(true);
  };

  const handleEditSubmit = async (content: string) => {
    await onEdit(comment.id, content);
    setIsEditing(false);
  };

  return (
    <div className={cn("group flex flex-col gap-2", !isReply && "pb-6 border-b border-border/10")}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="shrink-0 pt-1">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/5 flex items-center justify-center overflow-hidden border border-border/40">
            {comment.user.avatarUrl ? (
              <img
                src={comment.user.avatarUrl}
                alt={comment.user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-primary/70 capitalize">
                {comment.user.username.charAt(0)}
              </span>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-foreground hover:underline cursor-pointer">
                {comment.user.username}
              </span>
              {comment.isPinned && (
                <span className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                  <Pin className="w-2.5 h-2.5" /> Ghim
                </span>
              )}
              <span className="text-[11px] text-muted-foreground">
                {formatRelativeTime(comment.createdAt)}
              </span>
            </div>

            {/* Actions Menu */}
            {(isOwner || isAdmin) && !isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity p-0"
                  )}
                >
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  {isOwner && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit2 className="mr-2 h-3.5 w-3.5" />
                      <span>Sửa</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onDelete(comment.id)} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    <span>Xóa</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2">
              <CommentInput
                initialValue={comment.content}
                onSubmit={handleEditSubmit}
                onCancel={() => setIsEditing(false)}
                submitLabel="Lưu"
                autoFocus
              />
            </div>
          ) : (
            <>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                {comment.content}
              </p>

              {/* Interaction Bar */}
              <div className="flex items-center gap-4 mt-2">
                <button
                  onClick={() => onLike(comment.id)}
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-primary",
                    comment.isLikedByMe ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Heart className={cn("w-4 h-4", comment.isLikedByMe && "fill-current")} />
                  {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
                  <span>{comment.isLikedByMe ? "Đã thích" : "Thích"}</span>
                </button>

                {!isReply && (
                  <button
                    onClick={() => setIsReplying(!isReplying)}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Phản hồi</span>
                  </button>
                )}
              </div>
            </>
          )}

          {/* Reply Input */}
          {isReplying && (
            <div className="mt-4">
              <CommentInput
                onSubmit={handleReplySubmit}
                onCancel={() => setIsReplying(false)}
                placeholder={`Phản hồi ${comment.user.username}...`}
                autoFocus
                isReply
              />
            </div>
          )}

          {/* Replies Section */}
          {!isReply && comment.replyCount > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-xs font-bold text-primary hover:underline mb-2 flex items-center gap-1"
              >
                {showReplies ? "Thu gọn" : `Xem ${comment.replyCount} phản hồi`}
              </button>
              {showReplies && (
                <div className="pl-4 md:pl-10 border-l-2 border-border/20 space-y-4">
                  <ReplyList
                    commentId={comment.id}
                    onLike={onLike}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
