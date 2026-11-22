import type { Metadata } from "next";
import { CustomerOrdersView } from "@/components/orders/customer-orders-view";

export const metadata: Metadata = {
  title: "My Orders | PizzaHub",
  description:
    "Browse your PizzaHub order history, filter by delivery stage, and view tracking timelines.",
};

export default function CustomerOrdersPage() {
  return <CustomerOrdersView />;
}
