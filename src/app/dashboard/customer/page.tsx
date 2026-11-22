import type { Metadata } from "next";
import { CustomerOverview } from "@/components/customer/customer-overview";

export const metadata: Metadata = {
  title: "Customer Dashboard | PizzaHub",
  description:
    "View your active pizza cart, recent orders, and delivery updates on PizzaHub.",
};

export default function CustomerDashboardPage() {
  return <CustomerOverview />;
}
