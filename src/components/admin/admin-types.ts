export interface AdminSessionProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "admin";
}
