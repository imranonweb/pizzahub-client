import type { Metadata } from "next";
import { AdminTransactionsView } from "@/components/admin/admin-transactions-view";

export const metadata: Metadata = {
  title: "Transactions | Admin Dashboard | PizzaHub",
  description:
    "Inspect verified Stripe vendor subscription transactions across the PizzaHub platform.",
};

export default function AdminTransactionsPage() {
  return <AdminTransactionsView />;
}
