"use client";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
} from "lucide-react";
import { useId, useRef, useState } from "react";
import { useAuthSession } from "@/components/providers/session-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { changeAccountPassword } from "@/lib/profile-api";
import {
  getPasswordComplexityState,
  type PasswordChangeErrors,
  type PasswordChangeField,
  type PasswordChangeValues,
  validatePasswordChangeValues,
} from "@/lib/profile-validation";
import { cn } from "@/lib/utils";

const INITIAL_VALUES: PasswordChangeValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  revokeOtherSessions: true,
};

export function PasswordChangeForm() {
  const formId = useId();
  const { refreshSession } = useAuthSession();
  const submittingRef = useRef(false);

  const [values, setValues] = useState<PasswordChangeValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<PasswordChangeErrors>({});
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const updateField = (field: PasswordChangeField, nextValue: string) => {
    setValues((prev) => ({ ...prev, [field]: nextValue }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
    if (notice) setNotice(null);
  };

  const complexity = getPasswordComplexityState(values.newPassword);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;

    const validation = validatePasswordChangeValues(values);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setNotice(null);

    try {
      const result = await changeAccountPassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        revokeOtherSessions: values.revokeOtherSessions,
      });

      if (!result.ok) {
        setNotice({ tone: "error", message: result.message });
        toast.add({
          title: "Password update failed",
          description: result.message,
          type: "error",
        });
        return;
      }

      setValues(INITIAL_VALUES);
      await refreshSession();
      setNotice({ tone: "success", message: result.message });
      toast.add({
        title: "Password changed",
        description: result.message,
        type: "success",
      });
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const currentErrorId = `${formId}-current-error`;
  const newErrorId = `${formId}-new-error`;
  const confirmErrorId = `${formId}-confirm-error`;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${formId}-current`} className="font-medium">
          Current password
        </Label>
        <div className="relative">
          <Input
            id={`${formId}-current`}
            name="currentPassword"
            type={showCurrent ? "text" : "password"}
            autoComplete="current-password"
            value={values.currentPassword}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.currentPassword)}
            aria-describedby={
              errors.currentPassword ? currentErrorId : undefined
            }
            onChange={(event) =>
              updateField("currentPassword", event.target.value)
            }
            className="h-10 rounded-xl bg-background pr-10 pl-3.5"
          />
          <button
            type="button"
            aria-label={
              showCurrent ? "Hide current password" : "Show current password"
            }
            onClick={() => setShowCurrent((prev) => !prev)}
            className="absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {showCurrent ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.currentPassword ? (
          <p
            id={currentErrorId}
            role="alert"
            className="text-xs font-medium text-destructive"
          >
            {errors.currentPassword}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${formId}-new`} className="font-medium">
            New password
          </Label>
          <div className="relative">
            <Input
              id={`${formId}-new`}
              name="newPassword"
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              value={values.newPassword}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.newPassword)}
              aria-describedby={errors.newPassword ? newErrorId : undefined}
              onChange={(event) =>
                updateField("newPassword", event.target.value)
              }
              className="h-10 rounded-xl bg-background pr-10 pl-3.5"
            />
            <button
              type="button"
              aria-label={showNew ? "Hide new password" : "Show new password"}
              onClick={() => setShowNew((prev) => !prev)}
              className="absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showNew ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.newPassword ? (
            <p
              id={newErrorId}
              role="alert"
              className="text-xs font-medium text-destructive"
            >
              {errors.newPassword}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${formId}-confirm`} className="font-medium">
            Confirm new password
          </Label>
          <div className="relative">
            <Input
              id={`${formId}-confirm`}
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              value={values.confirmPassword}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={
                errors.confirmPassword ? confirmErrorId : undefined
              }
              onChange={(event) =>
                updateField("confirmPassword", event.target.value)
              }
              className="h-10 rounded-xl bg-background pr-10 pl-3.5"
            />
            <button
              type="button"
              aria-label={
                showConfirm ? "Hide confirm password" : "Show confirm password"
              }
              onClick={() => setShowConfirm((prev) => !prev)}
              className="absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showConfirm ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.confirmPassword ? (
            <p
              id={confirmErrorId}
              role="alert"
              className="text-xs font-medium text-destructive"
            >
              {errors.confirmPassword}
            </p>
          ) : null}
        </div>
      </div>

      <ul className="grid gap-1.5 rounded-xl border border-border bg-muted/30 p-3 text-xs sm:grid-cols-3">
        {[
          { ok: complexity.minLength, label: "At least 6 characters" },
          { ok: complexity.hasUppercase, label: "One uppercase letter" },
          { ok: complexity.hasLowercase, label: "One lowercase letter" },
        ].map((rule) => (
          <li
            key={rule.label}
            className={cn(
              "flex items-center gap-1.5",
              rule.ok
                ? "font-medium text-emerald-700 dark:text-emerald-300"
                : "text-muted-foreground",
            )}
          >
            <Check
              className={cn(
                "size-3.5 shrink-0",
                rule.ok ? "text-emerald-600" : "opacity-40",
              )}
              aria-hidden="true"
            />
            <span>{rule.label}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-start gap-2.5 pt-1">
        <Checkbox
          id={`${formId}-revoke`}
          checked={values.revokeOtherSessions}
          disabled={isSubmitting}
          onCheckedChange={(checked) =>
            setValues((prev) => ({
              ...prev,
              revokeOtherSessions: checked === true,
            }))
          }
          className="mt-0.5"
        />
        <Label
          htmlFor={`${formId}-revoke`}
          className="text-xs leading-relaxed font-normal text-muted-foreground"
        >
          Sign out all other active sessions on other browsers or devices when
          updating my password.
        </Label>
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
            {notice.tone === "success"
              ? "Password updated"
              : "Password change failed"}
          </AlertTitle>
          <AlertDescription>{notice.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end border-t border-border/70 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-9 rounded-xl px-4 font-semibold"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Updating Password...
            </>
          ) : (
            <>
              <KeyRound className="size-4" aria-hidden="true" />
              Update Password
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
