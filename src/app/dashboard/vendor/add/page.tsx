import type { Metadata } from "next";
import { VendorAddItemView } from "@/components/vendor/vendor-add-item-view";

export const metadata: Metadata = {
  title: "Add Pizza | PizzaHub",
  description:
    "Submit a new pizza or side listing with photos for admin review on PizzaHub.",
};

export default function VendorAddMenuItemPage() {
  return <VendorAddItemView />;
}
