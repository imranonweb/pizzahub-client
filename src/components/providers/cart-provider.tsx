"use client";

import { MotionConfig } from "motion/react";
import dynamic from "next/dynamic";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  addItemToCartList,
  CART_STORAGE_KEY,
  type CartItem,
  type CartSummary,
  computeCartSummary,
  removeCartItem,
  sanitizeStoredCartItems,
  updateCartItemQuantity,
} from "@/lib/cart-rules";

const CartDrawer = dynamic(
  () => import("@/components/cart/cart-drawer").then((mod) => mod.CartDrawer),
  { ssr: false },
);

export interface CartContextValue {
  items: CartItem[];
  summary: CartSummary;
  isHydrated: boolean;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  syncItemPrices: (
    updates: readonly { menuItemId: string; newPrice: number }[],
  ) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [hasOpenedDrawer, setHasOpenedDrawer] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        setItems(sanitizeStoredCartItems(parsed));
      }
    } catch {
      setItems([]);
    } finally {
      setIsHydrated(true);
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== CART_STORAGE_KEY) return;
      try {
        const parsed: unknown = event.newValue
          ? JSON.parse(event.newValue)
          : [];
        setItems(sanitizeStoredCartItems(parsed));
      } catch {
        setItems([]);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage quota errors cleanly
    }
  }, [items, isHydrated]);

  const setDrawerOpen = useCallback((open: boolean) => {
    if (open) {
      setHasOpenedDrawer(true);
    }
    setIsDrawerOpen(open);
  }, []);

  const openDrawer = useCallback(() => {
    setHasOpenedDrawer(true);
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const addItem = useCallback(
    (nextItem: Omit<CartItem, "quantity">, quantity = 1) => {
      setItems((prev) => addItemToCartList(prev, nextItem, quantity));
    },
    [],
  );

  const updateQuantity = useCallback((menuItemId: string, quantity: number) => {
    setItems((prev) => updateCartItemQuantity(prev, menuItemId, quantity));
  }, []);

  const removeItem = useCallback((menuItemId: string) => {
    setItems((prev) => removeCartItem(prev, menuItemId));
  }, []);

  const syncItemPrices = useCallback(
    (updates: readonly { menuItemId: string; newPrice: number }[]) => {
      if (updates.length === 0) return;
      const updateMap = new Map(
        updates.map((entry) => [entry.menuItemId, entry.newPrice]),
      );
      setItems((prev) =>
        prev.map((item) => {
          const nextPrice = updateMap.get(item.menuItemId);
          return nextPrice !== undefined
            ? { ...item, unitPrice: Math.round(nextPrice * 100) / 100 }
            : item;
        }),
      );
    },
    [],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const summary = useMemo(() => computeCartSummary(items), [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      summary,
      isHydrated,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      setDrawerOpen,
      addItem,
      updateQuantity,
      removeItem,
      syncItemPrices,
      clearCart,
    }),
    [
      items,
      summary,
      isHydrated,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      setDrawerOpen,
      addItem,
      updateQuantity,
      removeItem,
      syncItemPrices,
      clearCart,
    ],
  );

  return (
    <MotionConfig reducedMotion="user">
      <CartContext.Provider value={value}>
        {children}
        {hasOpenedDrawer ? <CartDrawer /> : null}
      </CartContext.Provider>
    </MotionConfig>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside a CartProvider.");
  }
  return ctx;
}
