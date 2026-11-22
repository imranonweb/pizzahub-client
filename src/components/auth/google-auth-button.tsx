"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { signInWithGoogle } from "@/lib/auth-client";
import { getSafeAuthErrorMessage } from "./auth-errors";

interface GoogleAuthButtonProps {
  enabled: boolean;
  mode: "sign-in" | "sign-up";
  callbackURL?: string;
  disabled?: boolean;
  onLoadingChange?: (loading: boolean) => void;
  onError?: (message: string) => void;
}

export function GoogleAuthButton({
  enabled,
  mode,
  callbackURL = "/",
  disabled = false,
  onLoadingChange,
  onError,
}: GoogleAuthButtonProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleGoogleAuth = async () => {
    if (!enabled || disabled || isRedirecting) {
      return;
    }

    setIsRedirecting(true);
    onLoadingChange?.(true);

    try {
      const response = await signInWithGoogle(callbackURL);
      if (response?.error) {
        const message = getSafeAuthErrorMessage(response.error, "google");
        onError?.(message);
        toast.add({
          title: "Google authentication failed",
          description: message,
          type: "error",
        });
        setIsRedirecting(false);
        onLoadingChange?.(false);
      }
    } catch {
      const message = getSafeAuthErrorMessage(null, "google");
      onError?.(message);
      toast.add({
        title: "Google authentication failed",
        description: message,
        type: "error",
      });
      setIsRedirecting(false);
      onLoadingChange?.(false);
    }
  };

  const label =
    mode === "sign-up" ? "Continue with Google" : "Sign in with Google";

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        disabled={!enabled || disabled || isRedirecting}
        onClick={handleGoogleAuth}
        className="h-11 w-full rounded-xl border-border bg-card font-medium text-foreground shadow-2xs transition-colors hover:bg-secondary/70"
      >
        {isRedirecting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            <span>Redirecting to Google…</span>
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>{label}</span>
          </>
        )}
      </Button>

      {!enabled ? (
        <p className="text-center text-xs text-muted-foreground">
          Google sign-in is unavailable until Google OAuth credentials are
          configured.
        </p>
      ) : mode === "sign-up" ? (
        <p className="text-center text-xs text-muted-foreground">
          Google sign-up creates a Customer account by default.
        </p>
      ) : null}
    </div>
  );
}
