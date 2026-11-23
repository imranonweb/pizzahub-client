"use client";

import {
  AlertCircle,
  CheckCircle2,
  Crown,
  Loader2,
  LogOut,
  Mail,
  RotateCw,
  Sparkles,
  Store,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { PasswordChangeForm } from "@/components/profile/password-change-form";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { useAuthSession } from "@/components/providers/session-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import {
  fetchVendorBusinessProfile,
  updateVendorBusinessProfile,
  type VendorBusinessProfileValues,
} from "@/lib/profile-api";
import { useVendorProfile } from "./vendor-dashboard-shell";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "VN";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function VendorProfileView() {
  const user = useVendorProfile();
  const router = useRouter();
  const { refreshSession, signOut } = useAuthSession();
  const formId = useId();
  const submittingRef = useRef(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut("/");
    } finally {
      setIsSigningOut(false);
    }
  };

  const [values, setValues] = useState<VendorBusinessProfileValues>({
    businessName: user.businessName,
    contactPhone: "",
    deliveryAddress: "",
  });
  const [initialValues, setInitialValues] =
    useState<VendorBusinessProfileValues>({
      businessName: user.businessName,
      contactPhone: "",
      deliveryAddress: "",
    });
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileSource, setProfileSource] = useState<"live" | "unavailable">(
    "live",
  );
  const [loadNotice, setLoadNotice] = useState<string | null>(null);
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);
  const [businessError, setBusinessError] = useState<string | null>(null);
  const [businessNotice, setBusinessNotice] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const loadBusinessProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    setLoadNotice(null);
    try {
      const response = await fetchVendorBusinessProfile();
      setProfileSource(response.source);
      if (response.source === "live" && response.profile) {
        const nextValues: VendorBusinessProfileValues = {
          businessName: response.profile.businessName || user.businessName,
          contactPhone: response.profile.contactPhone,
          deliveryAddress: response.profile.deliveryAddress,
        };
        setValues(nextValues);
        setInitialValues(nextValues);
      } else if (response.notice) {
        setLoadNotice(response.notice);
      }
    } catch (error) {
      setProfileSource("unavailable");
      setLoadNotice(
        error instanceof Error
          ? error.message
          : "Unable to load kitchen profile details.",
      );
    } finally {
      setIsLoadingProfile(false);
    }
  }, [user.businessName]);

  useEffect(() => {
    void loadBusinessProfile();
  }, [loadBusinessProfile]);

  const handleBusinessSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (submittingRef.current) return;

    const trimmedName = values.businessName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setBusinessError(
        "Restaurant / kitchen name must be between 2 and 100 characters.",
      );
      return;
    }

    const trimmedPhone = values.contactPhone.trim();
    if (trimmedPhone && trimmedPhone.length > 30) {
      setBusinessError("Contact phone must be 30 characters or fewer.");
      return;
    }

    const trimmedAddress = values.deliveryAddress.trim();
    if (trimmedAddress && trimmedAddress.length > 300) {
      setBusinessError("Kitchen address must be 300 characters or fewer.");
      return;
    }

    setBusinessError(null);
    setBusinessNotice(null);
    submittingRef.current = true;
    setIsSavingBusiness(true);

    try {
      const result = await updateVendorBusinessProfile({
        businessName: trimmedName,
        contactPhone: trimmedPhone,
        deliveryAddress: trimmedAddress,
      });

      if (!result.ok) {
        setBusinessNotice({ tone: "error", message: result.message });
        toast.add({
          title: "Kitchen profile update failed",
          description: result.message,
          type: "error",
        });
        return;
      }

      setValues(result.profile);
      setInitialValues(result.profile);
      await refreshSession();
      router.refresh();
      setBusinessNotice({ tone: "success", message: result.message });
      toast.add({
        title: "Kitchen profile updated",
        description: result.message,
        type: "success",
      });
    } finally {
      submittingRef.current = false;
      setIsSavingBusiness(false);
    }
  };

  const isBusinessDirty =
    values.businessName.trim() !== initialValues.businessName.trim() ||
    values.contactPhone.trim() !== initialValues.contactPhone.trim() ||
    values.deliveryAddress.trim() !== initialValues.deliveryAddress.trim();

  const isPremium = user.subscriptionPlan === "premium";
  const displayName = values.businessName.trim() || user.name;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="font-heading text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
            Vendor Profile Settings
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Manage your kitchen storefront name, contact details, personal
            account info, and password.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isPremium ? (
            <Badge className="gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
              <Crown className="size-3.5" aria-hidden="true" />
              Premium Plan
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            >
              <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
              Free Plan
            </Badge>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSigningOut}
            onClick={handleSignOut}
            className="h-9 gap-1.5 rounded-xl bg-card px-3.5 text-destructive hover:text-destructive"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
          </Button>
        </div>
      </div>

      <section
        aria-labelledby="vendor-identity-heading"
        className="rounded-2xl border border-border bg-card p-6"
      >
        <div className="flex flex-wrap items-center gap-4">
          <Avatar size="lg" className="size-14">
            {user.image ? (
              <AvatarImage src={user.image} alt={user.name} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-base font-bold text-primary">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            <h2
              id="vendor-identity-heading"
              className="font-heading text-xl font-semibold text-foreground"
            >
              {displayName}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-3.5 text-primary" aria-hidden="true" />
                {user.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Store className="size-3.5 text-primary" aria-hidden="true" />
                Vendor Account
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        <section
          aria-labelledby="kitchen-profile-heading"
          className="rounded-2xl border border-border bg-card p-6 lg:col-span-6"
        >
          <div className="mb-5 space-y-1 border-b border-border/70 pb-4">
            <h2
              id="kitchen-profile-heading"
              className="font-heading text-lg font-semibold text-foreground"
            >
              Kitchen & Contact Details
            </h2>
            <p className="text-sm text-muted-foreground">
              Shown to customers on menu listings and incoming order receipts.
            </p>
          </div>

          {loadNotice ? (
            <Alert className="mb-4 rounded-xl bg-accent/65">
              <AlertCircle className="size-4 text-primary" aria-hidden="true" />
              <AlertTitle>Profile API Notice</AlertTitle>
              <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
                <span>{loadNotice}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void loadBusinessProfile()}
                  className="rounded-xl bg-card"
                >
                  <RotateCw className="size-3.5" aria-hidden="true" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          {isLoadingProfile ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ) : (
            <form
              onSubmit={handleBusinessSubmit}
              noValidate
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor={`${formId}-business-name`}>
                  Restaurant / Kitchen Name
                </Label>
                <Input
                  id={`${formId}-business-name`}
                  value={values.businessName}
                  disabled={isSavingBusiness || profileSource === "unavailable"}
                  onChange={(e) => {
                    setValues((prev) => ({
                      ...prev,
                      businessName: e.target.value,
                    }));
                    setBusinessError(null);
                    setBusinessNotice(null);
                  }}
                  placeholder="Napoli Wood-Fired Oven"
                  className="h-10 rounded-xl bg-background px-3.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-contact-phone`}>
                  Kitchen Contact Phone
                </Label>
                <Input
                  id={`${formId}-contact-phone`}
                  type="tel"
                  value={values.contactPhone}
                  disabled={isSavingBusiness || profileSource === "unavailable"}
                  onChange={(e) => {
                    setValues((prev) => ({
                      ...prev,
                      contactPhone: e.target.value,
                    }));
                    setBusinessError(null);
                    setBusinessNotice(null);
                  }}
                  placeholder="+1 (555) 234-5678"
                  className="h-10 rounded-xl bg-background px-3.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-kitchen-address`}>
                  Kitchen Street Address / Location
                </Label>
                <Input
                  id={`${formId}-kitchen-address`}
                  value={values.deliveryAddress}
                  disabled={isSavingBusiness || profileSource === "unavailable"}
                  onChange={(e) => {
                    setValues((prev) => ({
                      ...prev,
                      deliveryAddress: e.target.value,
                    }));
                    setBusinessError(null);
                    setBusinessNotice(null);
                  }}
                  placeholder="142 Brick Oven Ave, Downtown"
                  className="h-10 rounded-xl bg-background px-3.5"
                />
              </div>

              {businessError ? (
                <p
                  role="alert"
                  className="text-xs font-medium text-destructive"
                >
                  {businessError}
                </p>
              ) : null}

              {businessNotice ? (
                <Alert
                  variant={
                    businessNotice.tone === "error" ? "destructive" : "default"
                  }
                  className="rounded-xl"
                >
                  {businessNotice.tone === "success" ? (
                    <CheckCircle2
                      className="size-4 text-emerald-600"
                      aria-hidden="true"
                    />
                  ) : (
                    <AlertCircle className="size-4" aria-hidden="true" />
                  )}
                  <AlertTitle>
                    {businessNotice.tone === "success"
                      ? "Saved"
                      : "Update failed"}
                  </AlertTitle>
                  <AlertDescription>{businessNotice.message}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-border/70 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSavingBusiness || !isBusinessDirty}
                  onClick={() => {
                    setValues(initialValues);
                    setBusinessError(null);
                    setBusinessNotice(null);
                  }}
                  className="h-9 rounded-xl bg-card px-4"
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSavingBusiness ||
                    !isBusinessDirty ||
                    profileSource === "unavailable"
                  }
                  className="h-9 rounded-xl px-4 font-semibold"
                >
                  {isSavingBusiness ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      Saving...
                    </>
                  ) : (
                    "Save Kitchen Info"
                  )}
                </Button>
              </div>
            </form>
          )}
        </section>

        <section
          aria-labelledby="vendor-account-heading"
          className="rounded-2xl border border-border bg-card p-6 lg:col-span-6"
        >
          <div className="mb-5 space-y-1 border-b border-border/70 pb-4">
            <h2
              id="vendor-account-heading"
              className="font-heading text-lg font-semibold text-foreground"
            >
              Account Owner & Avatar
            </h2>
            <p className="text-sm text-muted-foreground">
              Update your personal display name and profile photo URL.
            </p>
          </div>
          <ProfileEditForm initialName={user.name} initialImage={user.image} />
        </section>
      </div>

      <section
        aria-labelledby="vendor-password-heading"
        className="rounded-2xl border border-border bg-card p-6"
      >
        <div className="mb-5 space-y-1 border-b border-border/70 pb-4">
          <h2
            id="vendor-password-heading"
            className="font-heading text-lg font-semibold text-foreground"
          >
            Security & Password
          </h2>
          <p className="text-sm text-muted-foreground">
            Keep your vendor dashboard protected by using a strong unique
            password.
          </p>
        </div>
        <PasswordChangeForm />
      </section>
    </div>
  );
}
