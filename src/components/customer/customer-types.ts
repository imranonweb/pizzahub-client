export interface CustomerSessionProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "customer";
}
