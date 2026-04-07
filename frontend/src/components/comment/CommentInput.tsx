import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface CommentInputProps {
  initialValue?: string;
  onCancel?: () => void;
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  autoFocus?: boolean;
  submitLabel?: string;
  isReply?: boolean;
}

export function CommentInput({
  initialValue = "",
  onCancel,
  onSubmit,
  placeholder = "Viết bình luận...",
  autoFocus = false,
  submitLabel = "Gửi",
  isReply = false,
}: CommentInputProps) {
  const [content, setContent] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    // Auto resize
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!content.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit(content);
      setContent("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
    if (e.key === "Escape" && onCancel) {
      onCancel();
    }
  };

  return (
    <div className={cn("flex gap-3", isReply && "mt-3")}>
      <div className="shrink-0">
        {isAuthenticated && user ? (
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-border/50">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-primary capitalize">
                {user.username.charAt(0)}
              </span>
            )}
          </div>
        ) : (
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-muted flex items-center justify-center border border-dashed border-border">
            <span className="text-xs text-muted-foreground">?</span>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={isAuthenticated ? placeholder : "Đăng nhập để bình luận"}
          readOnly={!isAuthenticated}
          onClick={() => !isAuthenticated && navigate("/login")}
          rows={1}
          className={cn(
            "w-full bg-muted/30 border border-border/50 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all resize-none min-h-[40px] max-h-[300px]",
            !isAuthenticated && "cursor-pointer hover:bg-muted/50"
          )}
        />
        
        {isAuthenticated && (content.trim() || initialValue) && (
          <div className="flex justify-end gap-2 items-center">
            <span className="text-[10px] text-muted-foreground hidden md:block">
              Ctrl + Enter để gửi
            </span>
            {onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={isSubmitting}
                className="h-8 text-xs"
              >
                Hủy
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className="h-8 px-4 text-xs font-semibold"
            >
              {isSubmitting ? "Đang gửi..." : submitLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
