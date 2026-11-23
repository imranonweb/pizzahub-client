import type { Metadata } from "next";
import { VendorProfileView } from "@/components/vendor/vendor-profile-view";

export const metadata: Metadata = {
  title: "Vendor Profile Settings | PizzaHub",
  description:
    "Update your kitchen name, contact details, avatar, and password on PizzaHub.",
};

export default function VendorProfilePage() {
  return <VendorProfileView />;
}
