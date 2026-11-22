import type { Metadata } from "next";
import { VendorMenuManager } from "@/components/vendor/vendor-menu-manager";

export const metadata: Metadata = {
  title: "My Menu Items | PizzaHub",
  description:
    "Manage, filter, edit, pause, and submit your pizzeria menu listings.",
};

export default function VendorMenuManagementPage() {
  return <VendorMenuManager />;
}
