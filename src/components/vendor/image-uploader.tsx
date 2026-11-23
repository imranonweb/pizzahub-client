"use client";

import {
  AlertCircle,
  ArrowUpLeft,
  ImagePlus,
  Link2,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import {
  type DragEvent,
  type KeyboardEvent,
  useId,
  useRef,
  useState,
} from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { uploadMenuImage } from "@/lib/vendor-menu-api";
import {
  formatBytes,
  isValidMenuImageUrl,
  MAX_IMAGE_SIZE_BYTES,
  MAX_MENU_IMAGES,
  validateImageFile,
} from "@/lib/vendor-menu-validation";

interface UploadTask {
  id: string;
  fingerprint: string;
  file: File;
  fileName: string;
  progress: number;
  status: "uploading" | "failed";
  errorMessage?: string;
}

function getFileFingerprint(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export function ImageUploader({
  value,
  onChange,
  onUploadingChange,
  disabled = false,
  errorId,
  invalid = false,
}: {
  value: string[];
  onChange: (nextUrls: string[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
  disabled?: boolean;
  errorId?: string;
  invalid?: boolean;
}) {
  const inputId = useId();
  const urlInputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const uploadedByFingerprintRef = useRef<Map<string, string>>(new Map());
  const inFlightFingerprintsRef = useRef<Set<string>>(new Set());
  const latestUrlsRef = useRef<string[]>(value);
  latestUrlsRef.current = value;

  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [pastedUrl, setPastedUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  const syncUploadingState = (nextTasks: UploadTask[]) => {
    onUploadingChange?.(nextTasks.some((t) => t.status === "uploading"));
  };

  const commitUrl = (url: string) => {
    if (latestUrlsRef.current.includes(url)) {
      return;
    }
    const updated = [...latestUrlsRef.current, url].slice(0, MAX_MENU_IMAGES);
    latestUrlsRef.current = updated;
    onChange(updated);
  };

  const handleAddDirectUrl = () => {
    if (disabled) return;
    const candidate = pastedUrl.trim();
    if (!candidate) {
      setUrlError("Paste an https:// image link to attach.");
      return;
    }

    if (!isValidMenuImageUrl(candidate)) {
      setUrlError("Enter a valid https:// image URL.");
      return;
    }

    if (latestUrlsRef.current.includes(candidate)) {
      setUrlError("This image link is already attached to your listing.");
      return;
    }

    if (latestUrlsRef.current.length >= MAX_MENU_IMAGES) {
      setUrlError(
        `Maximum ${MAX_MENU_IMAGES} photos reached. Remove one before adding another.`,
      );
      return;
    }

    setUrlError(null);
    commitUrl(candidate);
    setPastedUrl("");
    toast.add({
      title: "Image link added",
      description: "Photo URL attached to your pizza listing.",
      type: "success",
    });
  };

  const handleUrlKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddDirectUrl();
    }
  };

  const runUploadTask = async (task: UploadTask) => {
    inFlightFingerprintsRef.current.add(task.fingerprint);

    try {
      const result = await uploadMenuImage(task.file, (percent) => {
        setTasks((prev) =>
          prev.map((item) =>
            item.id === task.id ? { ...item, progress: percent } : item,
          ),
        );
      });

      uploadedByFingerprintRef.current.set(task.fingerprint, result.url);
      commitUrl(result.url);

      setTasks((prev) => {
        const remaining = prev.filter((item) => item.id !== task.id);
        syncUploadingState(remaining);
        return remaining;
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload image.";
      setTasks((prev) => {
        const next = prev.map((item) =>
          item.id === task.id
            ? { ...item, status: "failed" as const, errorMessage: message }
            : item,
        );
        syncUploadingState(next);
        return next;
      });
    } finally {
      inFlightFingerprintsRef.current.delete(task.fingerprint);
    }
  };

  const handleFiles = (fileList: FileList | File[]) => {
    if (disabled) return;
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const activeUploadCount = tasks.filter(
      (t) => t.status === "uploading",
    ).length;
    const availableSlots =
      MAX_MENU_IMAGES - latestUrlsRef.current.length - activeUploadCount;

    if (availableSlots <= 0) {
      toast.add({
        title: `Maximum ${MAX_MENU_IMAGES} images reached`,
        description: "Remove an existing photo before adding a new one.",
        type: "warning",
      });
      return;
    }

    let slotsLeft = availableSlots;
    const tasksToStart: UploadTask[] = [];

    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.add({
          title: `Could not add ${file.name}`,
          description: validation.error,
          type: "error",
        });
        continue;
      }

      const fingerprint = getFileFingerprint(file);
      const cachedUrl = uploadedByFingerprintRef.current.get(fingerprint);

      if (cachedUrl) {
        if (latestUrlsRef.current.includes(cachedUrl)) {
          toast.add({
            title: "Duplicate photo skipped",
            description: `${file.name} is already attached to this listing.`,
            type: "info",
          });
          continue;
        }

        if (slotsLeft > 0) {
          commitUrl(cachedUrl);
          slotsLeft -= 1;
        }
        continue;
      }

      if (inFlightFingerprintsRef.current.has(fingerprint)) {
        continue;
      }

      if (slotsLeft <= 0) {
        toast.add({
          title: "Image limit reached",
          description: `Only up to ${MAX_MENU_IMAGES} images can be attached per item.`,
          type: "warning",
        });
        break;
      }

      slotsLeft -= 1;
      tasksToStart.push({
        id: `${fingerprint}-${Date.now()}`,
        fingerprint,
        file,
        fileName: file.name,
        progress: 8,
        status: "uploading",
      });
    }

    if (tasksToStart.length === 0) return;

    setTasks((prev) => {
      const next = [...prev, ...tasksToStart];
      syncUploadingState(next);
      return next;
    });

    for (const task of tasksToStart) {
      void runUploadTask(task);
    }
  };

  const handleRetryTask = (task: UploadTask) => {
    setTasks((prev) => {
      const next = prev.map((item) =>
        item.id === task.id
          ? {
              ...item,
              status: "uploading" as const,
              progress: 10,
              errorMessage: undefined,
            }
          : item,
      );
      syncUploadingState(next);
      return next;
    });
    void runUploadTask(task);
  };

  const handleDismissTask = (taskId: string) => {
    setTasks((prev) => {
      const next = prev.filter((item) => item.id !== taskId);
      syncUploadingState(next);
      return next;
    });
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(event.dataTransfer.files);
  };

  const handleRemoveUrl = (urlToRemove: string) => {
    onChange(value.filter((url) => url !== urlToRemove));
  };

  const handleMakeCover = (urlToPromote: string) => {
    const rest = value.filter((url) => url !== urlToPromote);
    onChange([urlToPromote, ...rest]);
  };

  const limitReached = value.length >= MAX_MENU_IMAGES;

  return (
    <div className="space-y-4">
      <section
        aria-label="Menu photo upload dropzone"
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-6 text-center transition-colors",
          isDragging
            ? "border-primary bg-accent/60"
            : invalid
              ? "border-destructive bg-destructive/5"
              : "border-border bg-muted/25 hover:border-primary/40 hover:bg-muted/40",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={errorId}
          onChange={(event) => {
            if (event.target.files) {
              handleFiles(event.target.files);
              event.target.value = "";
            }
          }}
          className="sr-only"
        />

        <div className="mb-2.5 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <UploadCloud className="size-5" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-foreground">
          Drop pizza photos here, or{" "}
          <button
            type="button"
            disabled={disabled || limitReached}
            onClick={() => inputRef.current?.click()}
            className="font-semibold text-primary underline underline-offset-4 hover:text-primary/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            browse files from your device
          </button>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          JPG, PNG, or WebP up to {formatBytes(MAX_IMAGE_SIZE_BYTES)} each (max{" "}
          {MAX_MENU_IMAGES} photos).
        </p>
      </section>

      <div className="rounded-2xl border border-border bg-muted/20 p-3.5">
        <label
          htmlFor={urlInputId}
          className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold text-foreground"
        >
          <span className="inline-flex items-center gap-1.5">
            <Link2 className="size-3.5 text-primary" aria-hidden="true" />
            Or paste an image URL
          </span>
          <span className="font-mono text-[11px] font-normal text-muted-foreground tabular-nums">
            {value.length} / {MAX_MENU_IMAGES} attached
          </span>
        </label>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id={urlInputId}
            type="url"
            value={pastedUrl}
            disabled={disabled || limitReached}
            onKeyDown={handleUrlKeyDown}
            onChange={(event) => {
              setPastedUrl(event.target.value);
              if (urlError) setUrlError(null);
            }}
            placeholder="https://example.com/pizza-photo.jpg"
            className="h-9 flex-1 rounded-xl bg-background px-3 text-xs"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || limitReached || !pastedUrl.trim()}
            onClick={handleAddDirectUrl}
            className="h-9 shrink-0 rounded-xl bg-card px-3.5 text-xs font-semibold"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add Image Link
          </Button>
        </div>

        {urlError ? (
          <p
            role="alert"
            className="mt-1.5 text-xs font-medium text-destructive"
          >
            {urlError}
          </p>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {tasks.map((task) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.16 }}
          >
            {task.status === "uploading" ? (
              <div className="rounded-xl border border-border bg-card p-3">
                <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                  <span className="inline-flex min-w-0 items-center gap-2 font-medium text-foreground">
                    <Loader2
                      className="size-3.5 shrink-0 animate-spin text-primary"
                      aria-hidden="true"
                    />
                    <span className="truncate">{task.fileName}</span>
                  </span>
                  <span className="shrink-0 font-mono text-muted-foreground tabular-nums">
                    {task.progress}%
                  </span>
                </div>
                <Progress value={task.progress} />
              </div>
            ) : (
              <Alert variant="destructive" className="rounded-xl p-3">
                <AlertCircle className="size-4" aria-hidden="true" />
                <AlertDescription className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="min-w-0">
                    <span className="font-semibold">{task.fileName}:</span>{" "}
                    {task.errorMessage}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleRetryTask(task)}
                      className="h-7 rounded-lg bg-background px-2.5 text-xs text-foreground"
                    >
                      <RotateCcw className="size-3" aria-hidden="true" />
                      Retry
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismissTask(task.id)}
                      className="h-7 rounded-lg px-2 text-xs"
                    >
                      Dismiss
                    </Button>
                  </span>
                </AlertDescription>
              </Alert>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {value.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((url, idx) => {
            const isCover = idx === 0;
            return (
              <div
                key={url}
                className="group relative overflow-hidden rounded-xl border border-border bg-card"
              >
                <div className="relative aspect-[4/3] w-full bg-muted">
                  <Image
                    src={url}
                    alt={`Uploaded pizza image ${idx + 1}`}
                    fill
                    unoptimized
                    sizes="(min-width: 640px) 180px, 45vw"
                    className="object-cover"
                  />
                </div>

                <div className="flex items-center justify-between gap-1.5 border-t border-border/70 px-2.5 py-2">
                  {isCover ? (
                    <Badge className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      Cover photo
                    </Badge>
                  ) : (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleMakeCover(url)}
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <ArrowUpLeft className="size-3" aria-hidden="true" />
                      Set cover
                    </button>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={disabled}
                    aria-label={`Remove image ${idx + 1}`}
                    onClick={() => handleRemoveUrl(url)}
                    className="size-7 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            );
          })}

          {value.length < MAX_MENU_IMAGES ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/20 p-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ImagePlus className="size-5 text-primary" aria-hidden="true" />
              <span>Add another</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
