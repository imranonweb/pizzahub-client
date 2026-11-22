import type { Metadata } from "next";
import { AdminProfileView } from "@/components/admin/admin-profile-view";

export const metadata: Metadata = {
  title: "Admin Profile | PizzaHub",
  description:
    "View administrator account details and platform security controls on PizzaHub.",
};

export default function AdminProfilePage() {
  return <AdminProfileView />;
}
