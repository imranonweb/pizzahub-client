"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Loader2,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { useCart } from "@/components/providers/cart-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { useAuthSession } from "@/components/providers/session-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PizzaImage } from "@/components/ui/pizza-image";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { buildSignInRedirectUrl } from "@/lib/auth-routes";
import { MAX_CART_ITEM_QUANTITY } from "@/lib/cart-rules";
import {
  translateCategory,
  translateMenuStatus,
} from "@/lib/i18n/translations";
import {
  fetchPublicMenuItemById,
  type MenuItemDetailResult,
} from "@/lib/menu-api";
import { createCustomerOrder } from "@/lib/order-api";
import {
  type CheckoutFormErrors,
  type CustomerOrder,
  getTodayIsoDate,
  validateCheckoutForm,
} from "@/lib/order-rules";
import { fetchCustomerContactProfile } from "@/lib/profile-api";
import { cn } from "@/lib/utils";
import { MenuDetailSkeleton } from "./menu-skeletons";

interface MenuDetailClientProps {
  itemId: string;
}

export function MenuDetailClient({ itemId }: MenuDetailClientProps) {
  const { locale, t } = useLanguage();
  const {
    user,
    role,
    isLoading: sessionLoading,
    isAuthenticated,
  } = useAuthSession();
  const { openDrawer, summary } = useCart();

  const [detail, setDetail] = useState<MenuItemDetailResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [reloadNonce, setReloadNonce] = useState(0);

  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(() => getTodayIsoDate());
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [orderFieldErrors, setOrderFieldErrors] = useState<CheckoutFormErrors>(
    {},
  );
  const [orderSubmitError, setOrderSubmitError] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<CustomerOrder | null>(null);
  const [profilePrefilled, setProfilePrefilled] = useState(false);

  useEffect(() => {
    if (!orderDialogOpen || profilePrefilled || !isAuthenticated) {
      return;
    }
    if (role !== "customer") {
      return;
    }
    let cancelled = false;
    fetchCustomerContactProfile()
      .then((res) => {
        if (cancelled || res.source !== "live" || !res.profile) return;
        if (res.profile.deliveryAddress) {
          setDeliveryAddress((prev) =>
            prev.trim() ? prev : res.profile?.deliveryAddress || "",
          );
        }
        if (res.profile.contactPhone) {
          setContactPhone((prev) =>
            prev.trim() ? prev : res.profile?.contactPhone || "",
          );
        }
        setProfilePrefilled(true);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [orderDialogOpen, profilePrefilled, isAuthenticated, role]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setErrorMessage(null);
    setSelectedImageIndex(0);
    setSelectedQuantity(1);

    void reloadNonce;

    fetchPublicMenuItemById(itemId)
      .then((result) => {
        if (!cancelled) {
          setDetail(result);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Failed to load this pizza item.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [itemId, reloadNonce]);

  if (isLoading) {
    return <MenuDetailSkeleton />;
  }

  if (errorMessage) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
        <Alert variant="destructive" className="rounded-2xl p-6">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Unable to load item details</AlertTitle>
          <AlertDescription className="mt-2 space-y-4">
            <p>{errorMessage}</p>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReloadNonce((n) => n + 1)}
                className="rounded-xl bg-background text-foreground"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                {t.home.retry}
              </Button>
              <Link
                href="/menu"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "rounded-xl",
                )}
              >
                {t.menu.backToMenu}
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!detail || detail.state === "not-found") {
    const isInvalid = detail?.isInvalidId;
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-20 text-center sm:px-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {isInvalid ? "Invalid menu item ID" : "Menu item not found"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {isInvalid
            ? "The pizza link you followed is invalid or no longer active. Please choose a dish from our current menu."
            : "The menu item you requested does not exist or may have been removed by its kitchen."}
        </p>
        <Link
          href="/menu"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "mt-6 h-11 rounded-full px-6 font-semibold",
          )}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t.menu.backToMenu}
        </Link>
      </div>
    );
  }

  const item = detail.item;

  if (detail.state === "unavailable") {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-xs sm:p-10">
          <Badge variant="secondary" className="rounded-full">
            {translateMenuStatus(item.status, locale)}
          </Badge>
          <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {item.itemName} — {t.menu.unavailable}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            Only approved and active menu items can be ordered on PizzaHub.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/menu"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "h-11 rounded-full px-6 font-semibold",
              )}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {t.menu.backToMenu}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images =
    item.images.length > 0 ? item.images : ["/images/auth-pizza-hero.jpg"];
  const activeImage = images[selectedImageIndex] ?? images[0];
  const isPremiumVendor = item.vendor.subscriptionPlan === "premium";
  const signInRedirect = buildSignInRedirectUrl(`/menu/${item.id}`);
  const todayDate = getTodayIsoDate();
  const orderTotal = Math.round(item.price * selectedQuantity * 100) / 100;

  const openDirectOrderDialog = () => {
    setOrderFieldErrors({});
    setOrderSubmitError(null);
    setPlacedOrder(null);
    setDeliveryDate((prev) => (prev >= todayDate ? prev : todayDate));
    setOrderDialogOpen(true);
  };

  const handleDirectOrderSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPlacingOrder) return;

    setOrderSubmitError(null);
    const validation = validateCheckoutForm({
      deliveryDate,
      deliveryAddress,
      contactPhone,
      orderNotes,
    });

    if (!validation.valid || !validation.sanitized) {
      setOrderFieldErrors(validation.errors);
      return;
    }

    setOrderFieldErrors({});
    setIsPlacingOrder(true);

    try {
      const result = await createCustomerOrder({
        items: [{ menuItemId: item.id, quantity: selectedQuantity }],
        deliveryDate: validation.sanitized.deliveryDate,
        deliveryAddress: validation.sanitized.deliveryAddress,
        contactPhone: validation.sanitized.contactPhone,
        orderNotes: validation.sanitized.orderNotes,
      });

      if (!result.ok) {
        setOrderSubmitError(result.message);
        toast.add({
          title: "Could not place order",
          description: result.message,
          type: "error",
        });
        return;
      }

      if (result.order) {
        setPlacedOrder(result.order);
      }
      setOrderNotes("");
      toast.add({
        title: t.menu.orderSentTitle,
        description: `${selectedQuantity}× ${item.itemName} — ${item.vendor.businessName}.`,
        type: "success",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to place your order right now.";
      setOrderSubmitError(message);
      toast.add({
        title: "Could not place order",
        description: message,
        type: "error",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/" />}>
                {t.nav.home}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/menu" />}>
                {t.nav.browseMenu}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{item.itemName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Link
          href="/menu"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "rounded-full bg-card px-4",
          )}
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t.menu.backToMenu}
        </Link>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-start">
        <div className="space-y-3.5">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] bg-muted shadow-lg ring-1 ring-border/80">
            <PizzaImage
              src={activeImage}
              alt={item.itemName}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-center"
            />
          </div>

          {images.length > 1 ? (
            <div className="flex flex-wrap gap-2.5">
              {images.map((imgUrl, index) => {
                const selected = index === selectedImageIndex;
                return (
                  <button
                    key={imgUrl}
                    type="button"
                    aria-label={`View photo ${index + 1} of ${item.itemName}`}
                    aria-pressed={selected}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      "relative aspect-[4/3] w-20 overflow-hidden rounded-xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selected
                        ? "border-primary shadow-xs"
                        : "border-transparent opacity-75 hover:opacity-100",
                    )}
                  >
                    <PizzaImage
                      src={imgUrl}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full font-medium">
                {translateCategory(item.category, locale)}
              </Badge>
              {isPremiumVendor ? (
                <Badge className="gap-1 rounded-full bg-primary text-primary-foreground">
                  <Sparkles className="size-3" aria-hidden="true" />
                  {t.menu.premiumKitchen}
                </Badge>
              ) : null}
              <Badge
                variant="outline"
                className="gap-1.5 rounded-full border-emerald-600/30 bg-emerald-600/10 text-emerald-800 dark:text-emerald-300"
              >
                <span
                  aria-hidden="true"
                  className="size-1.5 rounded-full bg-emerald-600"
                />
                {t.menu.available}
              </Badge>
            </div>

            <h1 className="font-heading text-3xl font-extrabold tracking-[-0.025em] text-foreground sm:text-4xl">
              {item.itemName}
            </h1>

            <p className="font-mono text-2xl font-bold tabular-nums text-primary">
              ${item.price.toFixed(2)}
            </p>
          </div>

          <p className="text-base leading-relaxed text-muted-foreground">
            {item.description}
          </p>

          <div className="surface-card rounded-3xl border border-border/90 bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-accent/80 text-primary">
                  <Store className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-heading text-base font-bold text-foreground">
                    {item.vendor.businessName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.menu.preparedBy} {item.vendor.name}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <MapPin className="size-4 text-primary" aria-hidden="true" />
                {item.location}
              </span>
            </div>
          </div>

          <div className="surface-card rounded-3xl border border-border/90 bg-card p-5 space-y-4">
            {sessionLoading ? (
              <div className="space-y-3" aria-hidden="true">
                <Skeleton className="h-5 w-44 rounded-md" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            ) : !isAuthenticated || !user || role === "customer" ? (
              <div className="space-y-4">
                {isAuthenticated && user?.id === item.vendorId ? (
                  <p className="text-sm font-medium text-foreground">
                    {t.menu.ownKitchenNotice}
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-foreground">
                        {t.menu.quantity}
                      </span>
                      <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-background p-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={selectedQuantity <= 1}
                          aria-label="Decrease quantity"
                          onClick={() =>
                            setSelectedQuantity((q) => Math.max(1, q - 1))
                          }
                          className="size-8 rounded-lg"
                        >
                          <Minus className="size-3.5" aria-hidden="true" />
                        </Button>
                        <span className="min-w-8 text-center font-mono text-sm font-semibold text-foreground tabular-nums">
                          {selectedQuantity}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={selectedQuantity >= MAX_CART_ITEM_QUANTITY}
                          aria-label="Increase quantity"
                          onClick={() =>
                            setSelectedQuantity((q) =>
                              Math.min(MAX_CART_ITEM_QUANTITY, q + 1),
                            )
                          }
                          className="size-8 rounded-lg"
                        >
                          <Plus className="size-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>

                    <div className="ticket-divider space-y-2.5 pt-4">
                      {isAuthenticated && role === "customer" ? (
                        <Button
                          type="button"
                          size="lg"
                          onClick={openDirectOrderDialog}
                          className="h-11 w-full rounded-xl font-semibold shadow-xs"
                        >
                          <UtensilsCrossed
                            className="size-4"
                            aria-hidden="true"
                          />
                          <span>
                            {t.menu.orderNowPrefix} — ${orderTotal.toFixed(2)} (
                            {t.menu.codLabel})
                          </span>
                        </Button>
                      ) : null}

                      <div className="flex flex-wrap gap-2.5">
                        <AddToCartButton
                          item={item}
                          quantity={selectedQuantity}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          onClick={openDrawer}
                          className="h-11 rounded-xl bg-background px-4 font-medium"
                        >
                          <ShoppingBag className="size-4" aria-hidden="true" />
                          <span>
                            {t.nav.cart}{" "}
                            {summary.itemCount > 0
                              ? `(${summary.itemCount})`
                              : ""}
                          </span>
                        </Button>
                      </div>
                    </div>

                    {!isAuthenticated ? (
                      <p className="text-xs text-muted-foreground">
                        {t.menu.signInPrompt}{" "}
                        <Link
                          href={signInRedirect}
                          className="font-semibold text-primary underline underline-offset-4"
                        >
                          {t.menu.signInCustomerLink}
                        </Link>{" "}
                        {t.menu.signInPromptSuffix}
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            ) : role === "vendor" ? (
              <div className="space-y-2.5">
                <p className="text-sm font-medium text-foreground">
                  {t.menu.vendorRoleNotice}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t.menu.vendorRoleSub}
                </p>
                <Link
                  href="/dashboard/vendor"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "h-10 rounded-xl",
                  )}
                >
                  {t.menu.goVendorDashboard}
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-sm font-medium text-foreground">
                  {t.menu.adminRoleNotice}
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t.menu.adminRoleSub}
                </p>
                <Link
                  href="/dashboard/admin"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "h-10 rounded-xl",
                  )}
                >
                  {t.menu.goAdminDashboard}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={orderDialogOpen}
        onOpenChange={(open) => {
          if (!isPlacingOrder) {
            setOrderDialogOpen(open);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:max-w-lg">
          {placedOrder ? (
            <div className="space-y-5 py-2 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-600/12 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="size-6" aria-hidden="true" />
              </div>
              <div className="space-y-1.5">
                <DialogTitle className="font-heading text-xl font-bold text-foreground">
                  {t.menu.orderSentTitle}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  {t.menu.orderSentDescPrefix}{" "}
                  <span className="font-mono font-semibold text-foreground">
                    #{placedOrder.id}
                  </span>{" "}
                  {t.menu.orderSentDescMiddle} {item.vendor.businessName}.
                </DialogDescription>
              </div>

              <div className="rounded-2xl border border-border bg-muted/40 p-4 text-left text-xs text-muted-foreground space-y-1.5">
                <p>
                  <strong className="text-foreground">
                    {t.menu.dishLabel}:
                  </strong>{" "}
                  {selectedQuantity}× {item.itemName} ($
                  {placedOrder.total.toFixed(2)})
                </p>
                {placedOrder.deliveryDate ? (
                  <p>
                    <strong className="text-foreground">
                      {t.menu.deliveryDateLabel}:
                    </strong>{" "}
                    {placedOrder.deliveryDate}
                  </p>
                ) : null}
                <p>
                  <strong className="text-foreground">
                    {t.menu.deliveryAddressLabel}:
                  </strong>{" "}
                  {placedOrder.deliveryAddress}
                </p>
                <p>
                  <strong className="text-foreground">
                    {t.menu.paymentLabel}:
                  </strong>{" "}
                  {t.menu.codLabel}
                </p>
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
                <Link
                  href={`/dashboard/customer/orders/${encodeURIComponent(placedOrder.id)}`}
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "h-10 rounded-xl px-4 font-semibold",
                  )}
                >
                  <span>{t.menu.trackOrderStatus}</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/dashboard/customer/orders"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-10 rounded-xl bg-background px-4",
                  )}
                >
                  {t.menu.viewMyOrders}
                </Link>
              </div>
            </div>
          ) : (
            <form
              noValidate
              onSubmit={handleDirectOrderSubmit}
              className="space-y-4"
            >
              <DialogHeader>
                <DialogTitle className="font-heading text-xl font-bold text-foreground">
                  {t.menu.directOrderTitle}
                </DialogTitle>
                <DialogDescription>{t.menu.directOrderDesc}</DialogDescription>
              </DialogHeader>

              <div className="rounded-2xl border border-border bg-muted/40 p-3.5 text-xs space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">
                    {t.menu.customerLabel}
                  </span>
                  <span className="font-medium text-foreground truncate">
                    {user?.name} ({user?.email})
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">
                    {t.menu.vendorKitchenLabel}
                  </span>
                  <span className="font-medium text-foreground truncate">
                    {item.vendor.businessName} · {item.location}
                  </span>
                </div>
                <div className="ticket-divider flex items-center justify-between gap-2 pt-2">
                  <span className="text-muted-foreground">
                    {t.menu.selectedItemLabel}
                  </span>
                  <span className="font-mono font-semibold text-foreground tabular-nums">
                    {selectedQuantity}× {item.itemName} · $
                    {orderTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {orderSubmitError ? (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertCircle className="size-4" aria-hidden="true" />
                  <AlertTitle>Order could not be submitted</AlertTitle>
                  <AlertDescription>{orderSubmitError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-3.5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="direct-order-date"
                    className="inline-flex items-center gap-1.5"
                  >
                    <CalendarDays
                      className="size-3.5 text-primary"
                      aria-hidden="true"
                    />
                    {t.menu.deliveryDateLabel}
                  </Label>
                  <Input
                    id="direct-order-date"
                    type="date"
                    min={todayDate}
                    value={deliveryDate}
                    onChange={(event) => {
                      setDeliveryDate(event.target.value);
                      if (orderFieldErrors.deliveryDate) {
                        setOrderFieldErrors((prev) => ({
                          ...prev,
                          deliveryDate: undefined,
                        }));
                      }
                    }}
                    disabled={isPlacingOrder}
                    aria-invalid={Boolean(orderFieldErrors.deliveryDate)}
                    className="h-10 rounded-xl bg-background"
                    required
                  />
                  {orderFieldErrors.deliveryDate ? (
                    <p role="alert" className="text-xs text-destructive">
                      {orderFieldErrors.deliveryDate}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="direct-order-phone">
                    {t.menu.contactPhoneLabel}
                  </Label>
                  <Input
                    id="direct-order-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder={t.menu.phonePlaceholder}
                    value={contactPhone}
                    onChange={(event) => {
                      setContactPhone(event.target.value);
                      if (orderFieldErrors.contactPhone) {
                        setOrderFieldErrors((prev) => ({
                          ...prev,
                          contactPhone: undefined,
                        }));
                      }
                    }}
                    disabled={isPlacingOrder}
                    aria-invalid={Boolean(orderFieldErrors.contactPhone)}
                    className="h-10 rounded-xl bg-background"
                    required
                  />
                  {orderFieldErrors.contactPhone ? (
                    <p role="alert" className="text-xs text-destructive">
                      {orderFieldErrors.contactPhone}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="direct-order-address">
                  {t.menu.deliveryAddressLabel}
                </Label>
                <Input
                  id="direct-order-address"
                  type="text"
                  autoComplete="street-address"
                  placeholder={t.menu.addressPlaceholder}
                  value={deliveryAddress}
                  onChange={(event) => {
                    setDeliveryAddress(event.target.value);
                    if (orderFieldErrors.deliveryAddress) {
                      setOrderFieldErrors((prev) => ({
                        ...prev,
                        deliveryAddress: undefined,
                      }));
                    }
                  }}
                  disabled={isPlacingOrder}
                  aria-invalid={Boolean(orderFieldErrors.deliveryAddress)}
                  className="h-10 rounded-xl bg-background"
                  required
                />
                {orderFieldErrors.deliveryAddress ? (
                  <p role="alert" className="text-xs text-destructive">
                    {orderFieldErrors.deliveryAddress}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="direct-order-notes">
                    {t.menu.notesLabel}
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {t.menu.optional}
                  </span>
                </div>
                <Textarea
                  id="direct-order-notes"
                  rows={3}
                  maxLength={300}
                  placeholder={t.menu.notesPlaceholder}
                  value={orderNotes}
                  onChange={(event) => {
                    setOrderNotes(event.target.value);
                    if (orderFieldErrors.orderNotes) {
                      setOrderFieldErrors((prev) => ({
                        ...prev,
                        orderNotes: undefined,
                      }));
                    }
                  }}
                  disabled={isPlacingOrder}
                  aria-invalid={Boolean(orderFieldErrors.orderNotes)}
                  className="rounded-xl bg-background"
                />
                {orderFieldErrors.orderNotes ? (
                  <p role="alert" className="text-xs text-destructive">
                    {orderFieldErrors.orderNotes}
                  </p>
                ) : null}
              </div>

              <DialogFooter className="-mx-6 -mb-6 mt-2 rounded-b-3xl px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPlacingOrder}
                  onClick={() => setOrderDialogOpen(false)}
                  className="rounded-xl bg-background"
                >
                  {t.menu.cancelBtn}
                </Button>
                <Button
                  type="submit"
                  disabled={isPlacingOrder}
                  className="rounded-xl font-semibold"
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      <span>{t.menu.placingOrder}</span>
                    </>
                  ) : (
                    <span>
                      {t.menu.confirmOrderPrefix} (${orderTotal.toFixed(2)})
                    </span>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
