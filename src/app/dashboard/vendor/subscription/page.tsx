import type { Metadata } from "next";
import { VendorSubscriptionView } from "@/components/vendor/vendor-subscription-view";

export const metadata: Metadata = {
  title: "Vendor Subscription & Capacity | PizzaHub",
  description:
    "Manage your PizzaHub vendor subscription plan, monitor active menu capacity, and review billing details.",
};

export default function VendorSubscriptionPage() {
  return <VendorSubscriptionView />;
}
