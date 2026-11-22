import type { Metadata } from "next";
import { AdminUserManagement } from "@/components/admin/admin-user-management";

export const metadata: Metadata = {
  title: "User Management | PizzaHub",
  description:
    "View platform user accounts, verify roles, and manage blocked account access on PizzaHub.",
};

export default function AdminUserManagementPage() {
  return <AdminUserManagement />;
}
