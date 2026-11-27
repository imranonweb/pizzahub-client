"use client";

import { Check, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/providers/cart-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { useAuthSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { canAddItemToCart } from "@/lib/cart-rules";
import type { PublicMenuItem } from "@/lib/menu-api";
import { cn } from "@/lib/utils";

export function AddToCartButton({
  item,
  quantity = 1,
  compact = false,
  className,
}: {
  item: PublicMenuItem;
  quantity?: number;
  compact?: boolean;
  className?: string;
}) {
  const { addItem, openDrawer } = useCart();
  const { t } = useLanguage();
  const { user, role, isAuthenticated } = useAuthSession();
  const [recentlyAdded, setRecentlyAdded] = useState(false);

  const eligibility = canAddItemToCart({
    itemStatus: item.status,
    itemVendorId: item.vendorId,
    actorRole: isAuthenticated ? role : null,
    actorId: isAuthenticated && user ? user.id : null,
  });

  if (compact && (role === "vendor" || role === "admin") && isAuthenticated) {
    return null;
  }

  const handleAdd = () => {
    if (!eligibility.allowed) {
      toast.add({
        title: "Unable to add item",
        description:
          eligibility.reason ?? "This item cannot be added to your cart.",
        type: "warning",
      });
      return;
    }

    addItem(
      {
        menuItemId: item.id,
        vendorId: item.vendorId,
        vendorName: item.vendor.businessName,
        itemName: item.itemName,
        category: item.category,
        image: item.images[0] || "/images/auth-pizza-hero.jpg",
        unitPrice: item.price,
        location: item.location,
      },
      quantity,
    );

    setRecentlyAdded(true);
    setTimeout(() => setRecentlyAdded(false), 1400);

    toast.add({
      title: t.menu.addedToastTitle,
      description: `${quantity} × ${item.itemName}`,
      type: "success",
      actionProps: {
        children: t.menu.viewCartAction,
        onClick: () => openDrawer(),
      },
    });
  };

  return (
    <Button
      type="button"
      variant="default"
      size={compact ? "default" : "lg"}
      disabled={!eligibility.allowed}
      onClick={handleAdd}
      className={cn(
        compact
          ? "h-10 rounded-xl px-3.5 font-semibold"
          : "h-11 rounded-xl px-5 font-semibold",
        className,
      )}
    >
      {recentlyAdded ? (
        <>
          <Check className="size-4" aria-hidden="true" />
          <span>{t.menu.added}</span>
        </>
      ) : (
        <>
          <ShoppingBag className="size-4" aria-hidden="true" />
          <span>{compact ? t.menu.addCompact : t.menu.addToCart}</span>
        </>
      )}
    </Button>
  );
}
