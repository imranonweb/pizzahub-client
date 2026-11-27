"use client";

import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Info,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PizzaImage } from "@/components/ui/pizza-image";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { MAX_CART_ITEM_QUANTITY } from "@/lib/cart-rules";
import {
  createCustomerOrder,
  validateCartItemsAgainstServer,
} from "@/lib/order-api";
import {
  type CheckoutFormErrors,
  type CheckoutFormField,
  type CheckoutFormValues,
  type CustomerOrder,
  getTodayIsoDate,
  validateCheckoutForm,
} from "@/lib/order-rules";
import { fetchCustomerContactProfile } from "@/lib/profile-api";
import { cn } from "@/lib/utils";
import { OrderConfirmationCard } from "./order-confirmation-card";

export function CheckoutClient({
  customer,
}: {
  customer: { id: string; name: string; email: string };
}) {
  const formId = useId();
  const submittingRef = useRef(false);
  const { t } = useLanguage();

  const {
    items,
    summary,
    isHydrated,
    updateQuantity,
    removeItem,
    syncItemPrices,
    clearCart,
  } = useCart();

  const [values, setValues] = useState<CheckoutFormValues>({
    deliveryDate: getTodayIsoDate(),
    deliveryAddress: "",
    contactPhone: "",
    orderNotes: "",
  });
  const [errors, setErrors] = useState<CheckoutFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrders, setConfirmedOrders] = useState<CustomerOrder[]>([]);
  const [unavailableIds, setUnavailableIds] = useState<string[]>([]);
  const [submitNotice, setSubmitNotice] = useState<{
    tone: "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchCustomerContactProfile()
      .then((res) => {
        if (cancelled || res.source !== "live" || !res.profile) return;
        const saved = res.profile;
        setValues((prev) => ({
          ...prev,
          deliveryAddress: prev.deliveryAddress || saved.deliveryAddress,
          contactPhone: prev.contactPhone || saved.contactPhone,
        }));
      })
      .catch(() => {
        // Non-blocking prefill
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = <K extends CheckoutFormField>(
    field: K,
    nextValue: string,
  ) => {
    setValues((prev) => ({ ...prev, [field]: nextValue }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
    if (submitNotice) {
      setSubmitNotice(null);
    }
  };

  if (confirmedOrders.length > 0 && confirmedOrders[0]) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <OrderConfirmationCard
          order={confirmedOrders[0]}
          additionalOrders={confirmedOrders.slice(1)}
        />
      </div>
    );
  }

  if (!isHydrated) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <Skeleton className="h-9 w-56 rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-12">
          <Skeleton className="h-96 rounded-3xl lg:col-span-7" />
          <Skeleton className="h-80 rounded-3xl lg:col-span-5" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-16 text-center sm:px-6">
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShoppingBag className="size-6" aria-hidden="true" />
        </div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t.cart.emptyHeading}
        </h1>
        <p className="mt-2.5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t.cart.emptyDesc}
        </p>
        <Link
          href="/menu"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "mt-6 h-11 rounded-full px-6 font-semibold",
          )}
        >
          {t.nav.browseMenu}
        </Link>
      </div>
    );
  }

  const handleRemoveUnavailable = () => {
    for (const id of unavailableIds) {
      removeItem(id);
    }
    setUnavailableIds([]);
    setSubmitNotice(null);
    toast.add({
      title: "Cart updated",
      description: "Removed unavailable items from your cart.",
      type: "info",
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;

    const formValidation = validateCheckoutForm(values);
    if (!formValidation.valid || !formValidation.sanitized) {
      setErrors(formValidation.errors);
      setSubmitNotice({
        tone: "error",
        title: "Check delivery details",
        message: "Fix the highlighted fields before placing your order.",
      });
      const firstInvalidField = formValidation.errors.deliveryDate
        ? `${formId}-date`
        : formValidation.errors.deliveryAddress
          ? `${formId}-address`
          : formValidation.errors.contactPhone
            ? `${formId}-phone`
            : formValidation.errors.orderNotes
              ? `${formId}-notes`
              : null;
      if (firstInvalidField) {
        const el = document.getElementById(firstInvalidField);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus();
      }
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitNotice(null);
    setUnavailableIds([]);

    try {
      const serverCheck = await validateCartItemsAgainstServer(
        items,
        customer.id,
      );

      if (!serverCheck.ok) {
        if (
          serverCheck.reason === "price-changed" &&
          serverCheck.priceUpdates
        ) {
          syncItemPrices(serverCheck.priceUpdates);
        }
        if (
          serverCheck.reason === "item-unavailable" &&
          serverCheck.unavailableIds
        ) {
          setUnavailableIds(serverCheck.unavailableIds);
        }

        const isUnavailable = serverCheck.reason === "backend-unavailable";
        setSubmitNotice({
          tone: isUnavailable ? "info" : "error",
          title: isUnavailable
            ? "Kitchen menu service unavailable"
            : serverCheck.reason === "price-changed"
              ? "Menu prices updated"
              : "Order validation blocked",
          message:
            serverCheck.message ??
            "Unable to validate your cart items with the server.",
        });
        toast.add({
          title: isUnavailable
            ? "Order service unavailable"
            : "Review your cart",
          description:
            serverCheck.message ?? "Server item verification failed.",
          type: isUnavailable ? "warning" : "error",
        });
        return;
      }

      const result = await createCustomerOrder({
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
        deliveryDate: formValidation.sanitized.deliveryDate,
        deliveryAddress: formValidation.sanitized.deliveryAddress,
        contactPhone: formValidation.sanitized.contactPhone,
        orderNotes: formValidation.sanitized.orderNotes,
      });

      const placedOrders =
        result.ok && result.orders && result.orders.length > 0
          ? result.orders
          : result.ok && result.order
            ? [result.order]
            : [];

      if (!result.ok || placedOrders.length === 0) {
        const isUnavailable =
          !result.ok && result.reason === "backend-unavailable";
        const message = !result.ok
          ? result.message
          : "Order response was incomplete.";

        setSubmitNotice({
          tone: isUnavailable ? "info" : "error",
          title: isUnavailable
            ? "Order service temporarily unavailable"
            : "Could not place order",
          message,
        });
        toast.add({
          title: isUnavailable ? "Order service unavailable" : "Order failed",
          description: message,
          type: isUnavailable ? "warning" : "error",
        });
        return;
      }

      clearCart();
      setConfirmedOrders(placedOrders);
      toast.add({
        title: t.checkout.confirmedHeading,
        description: result.message,
        type: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while placing your order.";
      setSubmitNotice({
        tone: "error",
        title: "Could not place order",
        message,
      });
      toast.add({
        title: "Order failed",
        description: message,
        type: "error",
      });
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const dateErrorId = `${formId}-date-error`;
  const addressErrorId = `${formId}-address-error`;
  const phoneErrorId = `${formId}-phone-error`;
  const notesErrorId = `${formId}-notes-error`;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="flex flex-col gap-3 border-b border-border/75 pb-6">
        <Link
          href="/menu"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2.5 w-fit rounded-full px-3 text-muted-foreground hover:text-foreground",
          )}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t.menu.backToMenu}
        </Link>
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-extrabold tracking-[-0.025em] text-foreground sm:text-3xl">
            {t.checkout.heading}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t.checkout.subheading}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
        <div className="space-y-6 lg:col-span-7">
          <section
            aria-labelledby="checkout-customer-heading"
            className="surface-card rounded-3xl border border-border/90 bg-card p-5 sm:p-6"
          >
            <h2
              id="checkout-customer-heading"
              className="font-heading text-base font-bold text-foreground"
            >
              {t.checkout.customerInfoHeading}
            </h2>
            <div className="mt-3.5 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-2xl border border-border/80 bg-background px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  {t.checkout.nameLabel}
                </p>
                <p className="mt-0.5 font-medium text-foreground">
                  {customer.name}
                </p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-background px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  {t.checkout.emailLabel}
                </p>
                <p className="mt-0.5 truncate font-medium text-foreground">
                  {customer.email}
                </p>
              </div>
            </div>
          </section>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="surface-card space-y-5 rounded-3xl border border-border/90 bg-card p-5 sm:p-6"
          >
            <h2 className="font-heading text-base font-bold text-foreground">
              {t.checkout.deliveryDetailsHeading}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${formId}-date`} className="font-medium">
                  {t.checkout.deliveryDateLabel}
                </Label>
                <Input
                  id={`${formId}-date`}
                  name="deliveryDate"
                  type="date"
                  min={getTodayIsoDate()}
                  value={values.deliveryDate}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.deliveryDate)}
                  aria-describedby={
                    errors.deliveryDate ? dateErrorId : undefined
                  }
                  onChange={(event) =>
                    updateField("deliveryDate", event.target.value)
                  }
                  className="h-10 rounded-xl bg-background px-3.5"
                />
                {errors.deliveryDate ? (
                  <p
                    id={dateErrorId}
                    role="alert"
                    className="text-xs font-medium text-destructive"
                  >
                    {errors.deliveryDate}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-phone`} className="font-medium">
                  {t.checkout.contactPhoneLabel}
                </Label>
                <Input
                  id={`${formId}-phone`}
                  name="contactPhone"
                  type="tel"
                  autoComplete="tel"
                  placeholder={t.checkout.phonePlaceholder}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${formId}-address`} className="font-medium">
                {t.checkout.deliveryAddressLabel}
              </Label>
              <Textarea
                id={`${formId}-address`}
                name="deliveryAddress"
                rows={2}
                maxLength={240}
                placeholder={t.checkout.addressPlaceholder}
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

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor={`${formId}-notes`} className="font-medium">
                  {t.checkout.orderNotesLabel}
                </Label>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {values.orderNotes.trim().length} / 300
                </span>
              </div>
              <Textarea
                id={`${formId}-notes`}
                name="orderNotes"
                rows={3}
                maxLength={300}
                placeholder={t.checkout.notesPlaceholder}
                value={values.orderNotes}
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.orderNotes)}
                aria-describedby={errors.orderNotes ? notesErrorId : undefined}
                onChange={(event) =>
                  updateField("orderNotes", event.target.value)
                }
                className="rounded-xl bg-background px-3.5 py-2.5"
              />
              {errors.orderNotes ? (
                <p
                  id={notesErrorId}
                  role="alert"
                  className="text-xs font-medium text-destructive"
                >
                  {errors.orderNotes}
                </p>
              ) : null}
            </div>

            <div className="space-y-2.5">
              <Label className="font-medium">
                {t.checkout.paymentMethodLabel}
              </Label>
              <div
                role="radiogroup"
                aria-label={t.checkout.paymentMethodLabel}
                className="rounded-2xl border-2 border-primary bg-primary/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <Banknote className="size-4.5" aria-hidden="true" />
                    </span>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {t.checkout.codTitle}
                        </p>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="size-3" aria-hidden="true" />
                          {t.checkout.selectedBadge}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {t.checkout.codDesc}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {submitNotice ? (
              <Alert
                variant={
                  submitNotice.tone === "error" ? "destructive" : "default"
                }
                className="rounded-xl"
              >
                {submitNotice.tone === "info" ? (
                  <Info className="size-4 text-primary" aria-hidden="true" />
                ) : (
                  <AlertCircle className="size-4" aria-hidden="true" />
                )}
                <AlertTitle>{submitNotice.title}</AlertTitle>
                <AlertDescription className="space-y-3">
                  <p>{submitNotice.message}</p>
                  {unavailableIds.length > 0 ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveUnavailable}
                      className="h-8 rounded-lg bg-background text-foreground"
                    >
                      Remove unavailable{" "}
                      {unavailableIds.length === 1 ? "item" : "items"} (
                      {unavailableIds.length})
                    </Button>
                  ) : null}
                </AlertDescription>
              </Alert>
            ) : null}

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="h-12 w-full rounded-xl font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {t.checkout.verifyingBtn}
                </>
              ) : (
                `${t.checkout.placeOrderPrefix} · $${summary.subtotal.toFixed(2)})`
              )}
            </Button>
          </form>
        </div>

        <aside
          aria-labelledby="checkout-summary-heading"
          className="surface-card space-y-4 rounded-3xl border border-border/90 bg-card p-5 sm:p-6 lg:sticky lg:top-24 lg:col-span-5"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border/75 pb-3.5">
            <h2
              id="checkout-summary-heading"
              className="font-heading text-lg font-bold text-foreground"
            >
              {t.checkout.summaryHeading}
            </h2>
            <span className="font-mono text-xs font-medium text-muted-foreground tabular-nums">
              {summary.itemCount}{" "}
              {summary.itemCount === 1 ? t.cart.itemWord : t.cart.itemsWord}
            </span>
          </div>

          <div className="space-y-3">
            {items.map((item) => {
              const lineTotal =
                Math.round(item.unitPrice * item.quantity * 100) / 100;
              const isItemUnavailable = unavailableIds.includes(
                item.menuItemId,
              );
              return (
                <div
                  key={item.menuItemId}
                  className={cn(
                    "flex gap-3 rounded-2xl border bg-background p-3",
                    isItemUnavailable
                      ? "border-destructive/60 bg-destructive/5"
                      : "border-border/80",
                  )}
                >
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                    <PizzaImage
                      src={item.image}
                      alt={item.itemName}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {item.itemName}
                          </p>
                          {isItemUnavailable ? (
                            <Badge
                              variant="destructive"
                              className="rounded-full px-2 py-0 text-[10px]"
                            >
                              {t.menu.unavailable}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.vendorName}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={isSubmitting}
                        aria-label={`Remove ${item.itemName}`}
                        onClick={() => {
                          removeItem(item.menuItemId);
                          setUnavailableIds((prev) =>
                            prev.filter((id) => id !== item.menuItemId),
                          );
                        }}
                        className="size-7 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={isSubmitting}
                          aria-label={`Decrease quantity for ${item.itemName}`}
                          onClick={() =>
                            updateQuantity(item.menuItemId, item.quantity - 1)
                          }
                          className="size-6 rounded-md"
                        >
                          <Minus className="size-3" aria-hidden="true" />
                        </Button>
                        <span className="min-w-5 text-center font-mono text-xs font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={
                            isSubmitting ||
                            item.quantity >= MAX_CART_ITEM_QUANTITY
                          }
                          aria-label={`Increase quantity for ${item.itemName}`}
                          onClick={() =>
                            updateQuantity(item.menuItemId, item.quantity + 1)
                          }
                          className="size-6 rounded-md"
                        >
                          <Plus className="size-3" aria-hidden="true" />
                        </Button>
                      </div>

                      <span className="font-mono text-sm font-bold text-foreground tabular-nums">
                        ${lineTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="ticket-divider space-y-2.5 pt-3.5 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{t.checkout.paymentMethodLabel}</span>
              <span className="font-medium text-foreground">
                {t.menu.codLabel}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{t.checkout.subtotal}</span>
              <span className="font-mono font-medium text-foreground tabular-nums">
                ${summary.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="ticket-divider flex items-center justify-between pt-2.5 font-heading text-base font-bold text-foreground">
              <span>{t.checkout.total}</span>
              <span className="font-mono tabular-nums">
                ${summary.subtotal.toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {t.checkout.ratesNote}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
