import type { Metadata } from "next";
import { VendorOrdersView } from "@/components/vendor/vendor-orders-view";

export const metadata: Metadata = {
  title: "Incoming Orders | Vendor Dashboard | PizzaHub",
  description:
    "Manage incoming PizzaHub customer orders, accept or reject pending orders, and update kitchen preparation statuses.",
};

export default function VendorOrdersPage() {
  return <VendorOrdersView />;
}
