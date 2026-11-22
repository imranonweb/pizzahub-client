import type { Metadata } from "next";
import { AdminMenuModeration } from "@/components/admin/admin-menu-moderation";

export const metadata: Metadata = {
  title: "Menu Moderation | PizzaHub",
  description:
    "Review, approve, or reject submitted pizza menu listings across PizzaHub kitchens.",
};

export default function AdminMenuModerationPage() {
  return <AdminMenuModeration />;
}
