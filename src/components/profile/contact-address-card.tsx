"use client";

import {
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  MapPin,
  Phone,
  RotateCw,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import {
  type CustomerContactProfileResponse,
  fetchCustomerContactProfile,
  updateCustomerContactProfile,
} from "@/lib/profile-api";
import {
  type ContactProfileErrors,
  type ContactProfileField,
  type ContactProfileValues,
  validateContactProfileValues,
} from "@/lib/profile-validation";

export function ContactAddressCard() {
  const formId = useId();
  const submittingRef = useRef(false);

  const [remote, setRemote] = useState<CustomerContactProfileResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [values, setValues] = useState<ContactProfileValues>({
    contactPhone: "",
    deliveryAddress: "",
  });
  const [errors, setErrors] = useState<ContactProfileErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitNotice, setSubmitNotice] = useState<{
    tone: "success" | "info" | "error";
    title: string;
    message: string;
  } | null>(null);

  const loadContactProfile = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await fetchCustomerContactProfile();
      setRemote(response);
      if (response.source === "live" && response.profile) {
        setValues(response.profile);
      }
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load saved contact and delivery address.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContactProfile();
  }, [loadContactProfile]);

  const updateField = (field: ContactProfileField, nextValue: string) => {
    setValues((prev) => ({ ...prev, [field]: nextValue }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
    if (submitNotice) setSubmitNotice(null);
  };

  const handleCancel = () => {
    if (remote?.source === "live" && remote.profile) {
      setValues(remote.profile);
    } else {
      setValues({ contactPhone: "", deliveryAddress: "" });
    }
    setErrors({});
    setSubmitNotice(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;

    const validation = validateContactProfileValues(values);
    if (!validation.valid || !validation.sanitized) {
      setErrors(validation.errors);
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitNotice(null);

    try {
      const result = await updateCustomerContactProfile(validation.sanitized);
      if (!result.ok) {
        const isUnavailable = result.reason === "backend-unavailable";
        setSubmitNotice({
          tone: isUnavailable ? "info" : "error",
          title: isUnavailable
            ? "Express profile endpoint unavailable"
            : "Could not save contact details",
          message: result.message,
        });
        toast.add({
          title: isUnavailable
            ? "Profile backend not deployed yet"
            : "Save failed",
          description: result.message,
          type: isUnavailable ? "warning" : "error",
        });
        return;
      }

      setValues(result.profile);
      setRemote({
        source: "live",
        profile: result.profile,
      });
      setSubmitNotice({
        tone: "success",
        title: "Contact & address saved",
        message: result.message,
      });
      toast.add({
        title: "Delivery profile updated",
        description: result.message,
        type: "success",
      });
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const phoneErrorId = `${formId}-phone-error`;
  const addressErrorId = `${formId}-address-error`;

  return (
    <section
      aria-labelledby={`${formId}-heading`}
      className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-2xs"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 pb-4">
        <div className="space-y-1">
          <h2
            id={`${formId}-heading`}
            className="font-heading text-lg font-semibold text-foreground"
          >
            Contact & Saved Delivery Address
          </h2>
          <p className="text-sm text-muted-foreground">
            Default phone number and street address stored for future orders.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={() => void loadContactProfile()}
          className="h-8 rounded-xl bg-background px-3 text-xs"
        >
          <RotateCw
            className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : loadError ? (
        <Alert variant="destructive" className="rounded-xl">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Unable to load delivery profile</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : (
        <>
          {remote?.source === "unavailable" && remote.notice ? (
            <Alert className="rounded-xl bg-accent/65">
              <Info className="size-4 text-primary" aria-hidden="true" />
              <AlertTitle>Customer Delivery Profile API Pending</AlertTitle>
              <AlertDescription className="text-xs">
                {remote.notice}
              </AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor={`${formId}-phone`}
                className="flex items-center gap-1.5 font-medium"
              >
                <Phone className="size-3.5 text-primary" aria-hidden="true" />
                Contact phone
              </Label>
              <Input
                id={`${formId}-phone`}
                name="contactPhone"
                type="tel"
                autoComplete="tel"
                placeholder="e.g. +1 555-234-5678"
                value={values.contactPhone}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.contactPhone)}
                aria-describedby={
                  errors.contactPhone ? phoneErrorId : undefined
                }
                onChange={(event) =>
                  updateField("contactPhone", event.target.value)
                }
                className="h-10 rounded-xl bg-background px-3.5"
              />
              {errors.contactPhone ? (
                <p
                  id={phoneErrorId}
                  role="alert"
                  className="text-xs font-medium text-destructive"
                >
                  {errors.contactPhone}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor={`${formId}-address`}
                className="flex items-center gap-1.5 font-medium"
              >
                <MapPin className="size-3.5 text-primary" aria-hidden="true" />
                Saved delivery address
              </Label>
              <Textarea
                id={`${formId}-address`}
                name="deliveryAddress"
                rows={3}
                maxLength={240}
                placeholder="Street address, apartment/suite, and neighborhood"
                value={values.deliveryAddress}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.deliveryAddress)}
                aria-describedby={
                  errors.deliveryAddress ? addressErrorId : undefined
                }
                onChange={(event) =>
                  updateField("deliveryAddress", event.target.value)
                }
                className="rounded-xl bg-background px-3.5 py-2.5"
              />
              {errors.deliveryAddress ? (
                <p
                  id={addressErrorId}
                  role="alert"
                  className="text-xs font-medium text-destructive"
                >
                  {errors.deliveryAddress}
                </p>
              ) : null}
            </div>

            {submitNotice ? (
              <Alert
                variant={
                  submitNotice.tone === "error" ? "destructive" : "default"
                }
                className="rounded-xl"
              >
                {submitNotice.tone === "success" ? (
                  <CheckCircle2
                    className="size-4 text-emerald-600"
                    aria-hidden="true"
                  />
                ) : submitNotice.tone === "info" ? (
                  <Info className="size-4 text-primary" aria-hidden="true" />
                ) : (
                  <AlertCircle className="size-4" aria-hidden="true" />
                )}
                <AlertTitle>{submitNotice.title}</AlertTitle>
                <AlertDescription>{submitNotice.message}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-border/70 pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={handleCancel}
                className="h-9 rounded-xl bg-card px-4"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-9 rounded-xl px-4 font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    Saving...
                  </>
                ) : (
                  "Save Contact Info"
                )}
              </Button>
            </div>
          </form>
        </>
      )}
    </section>
  );
}
