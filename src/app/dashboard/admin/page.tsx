import type { Metadata } from "next";
import { AdminOverview } from "@/components/admin/admin-overview";

export const metadata: Metadata = {
  title: "Admin Dashboard | PizzaHub",
  description:
    "Platform analytics overview, moderation queues, and user management for PizzaHub administrators.",
};

export default function AdminDashboardPage() {
  return <AdminOverview />;
}
