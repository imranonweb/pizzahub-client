"use client";

import { AlertCircle, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useAuthSession } from "@/components/providers/session-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { updateAccountProfile } from "@/lib/profile-api";
import {
  type ProfileEditErrors,
  type ProfileEditField,
  type ProfileEditValues,
  validateProfileEditValues,
} from "@/lib/profile-validation";
import { getInitials } from "@/lib/utils";

export function ProfileEditForm({
  initialName,
  initialImage,
  onCancel,
  onSaved,
}: {
  initialName: string;
  initialImage: string | null;
  onCancel?: () => void;
  onSaved?: () => void;
}) {
  const formId = useId();
  const router = useRouter();
  const { refreshSession } = useAuthSession();
  const submittingRef = useRef(false);

  const [values, setValues] = useState<ProfileEditValues>({
    name: initialName,
    image: initialImage ?? "",
  });
  const [errors, setErrors] = useState<ProfileEditErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    setValues({
      name: initialName,
      image: initialImage ?? "",
    });
    setErrors({});
  }, [initialName, initialImage]);

  const updateField = (field: ProfileEditField, nextValue: string) => {
    setValues((prev) => ({ ...prev, [field]: nextValue }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
    if (notice) setNotice(null);
  };

  const handleReset = () => {
    setValues({
      name: initialName,
      image: initialImage ?? "",
    });
    setErrors({});
    setNotice(null);
    onCancel?.();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;

    const validation = validateProfileEditValues(values);
    if (!validation.valid || !validation.sanitized) {
      setErrors(validation.errors);
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setNotice(null);

    try {
      const result = await updateAccountProfile(validation.sanitized);
      if (!result.ok) {
        setNotice({ tone: "error", message: result.message });
        toast.add({
          title: "Profile update failed",
          description: result.message,
          type: "error",
        });
        return;
      }

      await refreshSession();
      router.refresh();
      setNotice({ tone: "success", message: result.message });
      toast.add({
        title: "Profile updated",
        description: result.message,
        type: "success",
      });
      onSaved?.();
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const previewUrl = values.image.trim();
  const isDirty =
    values.name.trim() !== initialName.trim() ||
    values.image.trim() !== (initialImage ?? "").trim();

  const nameErrorId = `${formId}-name-error`;
  const imageErrorId = `${formId}-image-error`;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-background p-4">
        <Avatar size="lg" className="size-14">
          {previewUrl ? (
            <AvatarImage src={previewUrl} alt={values.name || "Avatar"} />
          ) : null}
          <AvatarFallback className="bg-primary/10 text-base font-bold text-primary">
            {getInitials(values.name || initialName)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Profile Avatar Preview
          </p>
          <p className="text-xs text-muted-foreground">
            Provide a valid <code className="font-mono">https://</code> image
            URL to display across navigation and receipts.
          </p>
        </div>
        {previewUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isSubmitting}
            onClick={() => updateField("image", "")}
            className="h-8 rounded-lg px-2.5 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Remove
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${formId}-name`} className="font-medium">
            Full name
          </Label>
          <Input
            id={`${formId}-name`}
            name="name"
            autoComplete="name"
            value={values.name}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? nameErrorId : undefined}
            onChange={(event) => updateField("name", event.target.value)}
            className="h-10 rounded-xl bg-background px-3.5"
          />
          {errors.name ? (
            <p
              id={nameErrorId}
              role="alert"
              className="text-xs font-medium text-destructive"
            >
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${formId}-image`} className="font-medium">
            Avatar image URL (optional)
          </Label>
          <Input
            id={`${formId}-image`}
            name="image"
            type="url"
            placeholder="https://example.com/avatar.jpg"
            value={values.image}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.image)}
            aria-describedby={errors.image ? imageErrorId : undefined}
            onChange={(event) => updateField("image", event.target.value)}
            className="h-10 rounded-xl bg-background px-3.5"
          />
          {errors.image ? (
            <p
              id={imageErrorId}
              role="alert"
              className="text-xs font-medium text-destructive"
            >
              {errors.image}
            </p>
          ) : null}
        </div>
      </div>

      {notice ? (
        <Alert
          variant={notice.tone === "error" ? "destructive" : "default"}
          className="rounded-xl"
        >
          {notice.tone === "success" ? (
            <CheckCircle2
              className="size-4 text-emerald-600"
              aria-hidden="true"
            />
          ) : (
            <AlertCircle className="size-4" aria-hidden="true" />
          )}
          <AlertTitle>
            {notice.tone === "success" ? "Saved" : "Update failed"}
          </AlertTitle>
          <AlertDescription>{notice.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-border/70 pt-4">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={handleReset}
          className="h-9 rounded-xl bg-card px-4"
        >
          {onCancel ? "Cancel" : "Reset"}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="h-9 rounded-xl px-4 font-semibold"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}
