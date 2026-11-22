"use client";

import { ArrowLeft, CheckCircle2, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MENU_CATEGORIES } from "@/lib/menu-api";
import { FREE_PLAN_ACTIVE_ITEM_LIMIT } from "@/lib/vendor-menu-api";
import type { PizzaFormValues } from "@/lib/vendor-menu-validation";
import { PizzaForm } from "./pizza-form";
import { useVendorProfile } from "./vendor-dashboard-shell";
import { VendorStatusBadge } from "./vendor-status-badge";

export function VendorAddItemView() {
  const router = useRouter();
  const user = useVendorProfile();

  const [preview, setPreview] = useState<PizzaFormValues>({
    itemName: "",
    category: MENU_CATEGORIES[0],
    description: "",
    price: "",
    location: "",
    images: [],
  });

  const parsedPrice = Number(preview.price);
  const displayPrice =
    preview.price.trim() && Number.isFinite(parsedPrice) && parsedPrice > 0
      ? `$${parsedPrice.toFixed(2)}`
      : "$0.00";
  const coverImage = preview.images[0] || "/images/auth-pizza-hero.jpg";
  const kitchenName = user.businessName.trim() || user.name;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-border/70 pb-6">
        <Button
          render={<Link href="/dashboard/vendor/menu" />}
          variant="ghost"
          size="sm"
          className="-ml-2.5 w-fit rounded-xl px-2.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to My Menu Items
        </Button>

        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
            Add a New Pizza
          </h1>
          <p className="text-sm text-muted-foreground">
            Fill in the details and upload photos matching your PizzaHub kitchen
            listing.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-2xs sm:p-6">
          <PizzaForm
            mode="create"
            onValuesChange={setPreview}
            onSuccess={() => router.push("/dashboard/vendor/menu")}
          />
        </div>

        <aside aria-label="Listing preview and guidance" className="space-y-5">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xs">
            <div className="border-b border-border/70 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-foreground">
                  Customer Card Preview
                </p>
                <VendorStatusBadge status="pending" />
              </div>
            </div>

            <div className="relative aspect-[4/3] w-full bg-muted">
              <Image
                src={coverImage}
                alt={preview.itemName.trim() || "Pizza preview"}
                fill
                unoptimized
                sizes="(min-width: 1280px) 360px, 100vw"
                className="object-cover"
              />
            </div>

            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="secondary" className="rounded-full font-medium">
                  {preview.category || MENU_CATEGORIES[0]}
                </Badge>
                <span className="font-heading text-base font-bold text-foreground tabular-nums">
                  {displayPrice}
                </span>
              </div>

              <h2 className="font-heading text-lg font-semibold leading-snug text-foreground">
                {preview.itemName.trim() || "Your pizza title"}
              </h2>

              <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {preview.description.trim() ||
                  "Write a clear description of the crust, sauce, cheeses, and toppings to help customers choose."}
              </p>

              <div className="flex items-center justify-between gap-2 border-t border-border/70 pt-3 text-xs text-muted-foreground">
                <span className="truncate font-medium text-foreground">
                  {kitchenName}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1">
                  <MapPin
                    className="size-3.5 text-primary"
                    aria-hidden="true"
                  />
                  {preview.location.trim() || "Kitchen area"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-heading text-base font-semibold text-foreground">
              Publishing Checklist
            </h2>
            <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2
                  className="mt-0.5 size-3.5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>
                  High-contrast horizontal food photos look best in the 4:3 menu
                  grid.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2
                  className="mt-0.5 size-3.5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>
                  New submissions default to Pending until an administrator
                  approves them.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2
                  className="mt-0.5 size-3.5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>
                  {user.subscriptionPlan === "premium"
                    ? "Your Premium plan supports unlimited active listings."
                    : `Free plan accounts can keep up to ${FREE_PLAN_ACTIVE_ITEM_LIMIT} approved items active simultaneously.`}
                </span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
