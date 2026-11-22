"use client";

import {
  AlertCircle,
  ArrowLeft,
  Info,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Store,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { useCart } from "@/components/providers/cart-provider";
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
import { Skeleton } from "@/components/ui/skeleton";
import { buildSignInRedirectUrl } from "@/lib/auth-routes";
import { MAX_CART_ITEM_QUANTITY } from "@/lib/cart-rules";
import {
  fetchPublicMenuItemById,
  type MenuItemDetailResult,
} from "@/lib/menu-api";
import { cn } from "@/lib/utils";
import { MenuDetailSkeleton } from "./menu-skeletons";

interface MenuDetailClientProps {
  itemId: string;
}

export function MenuDetailClient({ itemId }: MenuDetailClientProps) {
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
                Try again
              </Button>
              <Link
                href="/menu"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "rounded-xl",
                )}
              >
                Back to Menu
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!detail || detail.state === "not-found") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-20 text-center sm:px-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Menu item not found
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          The menu item you requested does not exist or may have been removed by
          its kitchen.
        </p>
        <Link
          href="/menu"
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "mt-6 h-11 rounded-xl px-6 font-semibold",
          )}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Menu
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
            Status: {item.status}
          </Badge>
          <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {item.itemName} is currently unavailable
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            Only approved and active menu items can be ordered on PizzaHub.
            Explore other available pizzas from local kitchens instead.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/menu"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "h-11 rounded-xl px-6 font-semibold",
              )}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Browse Available Menu
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

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/" />}>Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/menu" />}>
                Browse Menu
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
            "rounded-xl bg-card",
          )}
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to Menu
        </Link>
      </div>

      {detail.source === "preview" && detail.apiNotice ? (
        <Alert className="rounded-2xl border-border bg-accent/65">
          <Info className="size-4 text-primary" aria-hidden="true" />
          <AlertTitle>Sample Menu Preview</AlertTitle>
          <AlertDescription>{detail.apiNotice}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
        <div className="space-y-3">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-muted shadow-lg ring-1 ring-border/70">
            <Image
              src={activeImage}
              alt={item.itemName}
              fill
              priority
              sizes="(min-width: 1024px) 48vw, 100vw"
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
                    <Image
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
                {item.category}
              </Badge>
              {isPremiumVendor ? (
                <Badge className="gap-1 rounded-full bg-primary text-primary-foreground">
                  <Sparkles className="size-3" aria-hidden="true" />
                  Premium Kitchen
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
                Available
              </Badge>
            </div>

            <h1 className="font-heading text-3xl font-bold tracking-[-0.025em] text-foreground sm:text-4xl">
              {item.itemName}
            </h1>

            <p className="font-heading text-2xl font-bold tabular-nums text-primary">
              ${item.price.toFixed(2)}
            </p>
          </div>

          <p className="text-base leading-relaxed text-muted-foreground">
            {item.description}
          </p>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                  <Store className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-heading text-base font-semibold text-foreground">
                    {item.vendor.businessName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Prepared by {item.vendor.name}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <MapPin className="size-4 text-primary" aria-hidden="true" />
                {item.location}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            {sessionLoading ? (
              <div className="space-y-3" aria-hidden="true">
                <Skeleton className="h-5 w-44 rounded-md" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            ) : !isAuthenticated || !user || role === "customer" ? (
              <div className="space-y-4">
                {isAuthenticated && user?.id === item.vendorId ? (
                  <p className="text-sm font-medium text-foreground">
                    You cannot order items from your own vendor kitchen.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-sm font-medium text-foreground">
                        Quantity
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
                        <span className="min-w-8 text-center text-sm font-semibold text-foreground tabular-nums">
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
                          Cart{" "}
                          {summary.itemCount > 0
                            ? `(${summary.itemCount})`
                            : ""}
                        </span>
                      </Button>
                    </div>

                    {!isAuthenticated ? (
                      <p className="text-xs text-muted-foreground">
                        Ready to complete your order?{" "}
                        <Link
                          href={signInRedirect}
                          className="font-semibold text-primary underline underline-offset-4"
                        >
                          Sign in as a Customer
                        </Link>{" "}
                        to check out.
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            ) : role === "vendor" ? (
              <div className="space-y-2.5">
                <p className="text-sm font-medium text-foreground">
                  Vendor accounts cannot place customer pizza orders.
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Switch to a Customer account to place orders, or manage your
                  kitchen from your dashboard.
                </p>
                <Link
                  href="/dashboard/vendor"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "h-10 rounded-xl",
                  )}
                >
                  Go to Vendor Dashboard
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-sm font-medium text-foreground">
                  Admin accounts cannot place customer orders.
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Admin accounts review menu items, users, and platform
                  transactions.
                </p>
                <Link
                  href="/dashboard/admin"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "h-10 rounded-xl",
                  )}
                >
                  Go to Admin Dashboard
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
