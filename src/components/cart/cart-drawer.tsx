"use client";

import {
  ArrowRight,
  Info,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/providers/cart-provider";
import { useAuthSession } from "@/components/providers/session-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { MAX_CART_ITEM_QUANTITY } from "@/lib/cart-rules";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const {
    items,
    summary,
    isDrawerOpen,
    setDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();
  const { isAuthenticated, role, isLoading } = useAuthSession();

  const handleClear = () => {
    clearCart();
    toast.add({
      title: "Cart cleared",
      description: "All items were removed from your cart.",
      type: "info",
    });
  };

  return (
    <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 bg-card p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border px-5 py-4">
          <div className="flex items-center justify-between gap-2 pr-8">
            <SheetTitle className="flex items-center gap-2 text-lg font-semibold">
              <ShoppingBag
                className="size-4.5 text-primary"
                aria-hidden="true"
              />
              <span>Your Cart</span>
              {summary.itemCount > 0 ? (
                <Badge
                  variant="secondary"
                  className="rounded-full px-2 py-0.5 text-xs tabular-nums"
                >
                  {summary.itemCount}
                </Badge>
              ) : null}
            </SheetTitle>

            {items.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-8 rounded-lg px-2 text-xs text-muted-foreground hover:text-destructive"
              >
                Clear cart
              </Button>
            ) : null}
          </div>
          <SheetDescription className="text-xs">
            Review items and adjust quantities before server checkout
            validation.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShoppingBag className="size-5" aria-hidden="true" />
              </div>
              <p className="font-heading text-lg font-semibold text-foreground">
                Your cart is empty
              </p>
              <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
                Explore wood-fired pizzas and sides from local PizzaHub kitchens
                to start an order.
              </p>
              <Link
                href="/menu"
                onClick={closeDrawer}
                className={cn(
                  buttonVariants({ variant: "default", size: "default" }),
                  "mt-5 h-10 rounded-xl px-5 font-semibold",
                )}
              >
                Browse Menu
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {items.map((item) => {
                  const lineTotal =
                    Math.round(item.unitPrice * item.quantity * 100) / 100;
                  return (
                    <motion.div
                      key={item.menuItemId}
                      layout="position"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      transition={{ duration: 0.16 }}
                      className="flex gap-3.5 rounded-2xl border border-border bg-background p-3"
                    >
                      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                        <Image
                          src={item.image}
                          alt={item.itemName}
                          fill
                          unoptimized
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link
                              href={`/menu/${encodeURIComponent(item.menuItemId)}`}
                              onClick={closeDrawer}
                              className="line-clamp-1 font-heading text-sm font-semibold text-foreground hover:text-primary"
                            >
                              {item.itemName}
                            </Link>
                            <p className="truncate text-xs text-muted-foreground">
                              {item.vendorName}
                            </p>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Remove ${item.itemName} from cart`}
                            onClick={() => removeItem(item.menuItemId)}
                            className="size-7 shrink-0 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-card p-0.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Decrease quantity of ${item.itemName}`}
                              onClick={() =>
                                updateQuantity(
                                  item.menuItemId,
                                  item.quantity - 1,
                                )
                              }
                              className="size-7 rounded-lg"
                            >
                              <Minus className="size-3" aria-hidden="true" />
                            </Button>
                            <span
                              aria-live="polite"
                              className="min-w-6 text-center text-xs font-semibold text-foreground tabular-nums"
                            >
                              {item.quantity}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              disabled={item.quantity >= MAX_CART_ITEM_QUANTITY}
                              aria-label={`Increase quantity of ${item.itemName}`}
                              onClick={() =>
                                updateQuantity(
                                  item.menuItemId,
                                  item.quantity + 1,
                                )
                              }
                              className="size-7 rounded-lg"
                            >
                              <Plus className="size-3" aria-hidden="true" />
                            </Button>
                          </div>

                          <span className="font-heading text-sm font-bold text-foreground tabular-nums">
                            ${lineTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {items.length > 0 ? (
          <div className="space-y-4 border-t border-border bg-muted/25 px-5 py-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Estimated subtotal ({summary.itemCount} items)</span>
                <span className="font-medium text-foreground tabular-nums">
                  ${summary.subtotal.toFixed(2)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between font-heading text-base font-bold text-foreground">
                <span>Estimated total</span>
                <span className="tabular-nums">
                  ${summary.subtotal.toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Item availability and authoritative pricing are verified against
                the Express server at checkout.
              </p>
            </div>

            {isLoading ? (
              <Button disabled className="h-11 w-full rounded-xl">
                Checking account...
              </Button>
            ) : !isAuthenticated ? (
              <Link
                href="/sign-in?callbackUrl=%2Fcheckout"
                onClick={closeDrawer}
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-11 w-full rounded-xl font-semibold",
                )}
              >
                Sign in to Checkout
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : role === "customer" ? (
              <Link
                href="/checkout"
                onClick={closeDrawer}
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-11 w-full rounded-xl font-semibold",
                )}
              >
                Proceed to Checkout
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            ) : (
              <Alert className="rounded-xl bg-card p-3">
                <Info className="size-4 text-primary" aria-hidden="true" />
                <AlertDescription className="text-xs">
                  Only signed-in Customer accounts can submit pizza orders.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
