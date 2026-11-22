import type { Metadata } from "next";
import { PublicShell } from "@/components/layout/public-shell";
import { NotificationPageClient } from "@/components/notifications/notification-page-client";

export const metadata: Metadata = {
  title: "Notification Center | PizzaHub",
  description:
    "View your PizzaHub order status updates, kitchen alerts, and account notifications.",
};

export default function NotificationsPage() {
  return (
    <PublicShell>
      <NotificationPageClient />
    </PublicShell>
  );
}
