import type { PizzaHubRole, SubscriptionPlan } from "@/lib/auth";

export interface AuthenticatedProfileData {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: PizzaHubRole;
  businessName: string;
  subscriptionPlan: SubscriptionPlan;
  emailVerified: boolean;
  createdAt: string | null;
}
