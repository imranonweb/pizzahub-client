import type { Metadata } from "next";
import { VendorOverview } from "@/components/vendor/vendor-overview";

export const metadata: Metadata = {
  title: "Vendor Dashboard | PizzaHub",
  description:
    "Monitor your pizza listings, admin approvals, and kitchen plan usage on PizzaHub.",
};

export default function VendorDashboardPage() {
  return <VendorOverview />;
}
