export interface VendorSessionProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  businessName: string;
  subscriptionPlan: "free" | "premium";
  subscriptionExpiresAt: string | null;
}
