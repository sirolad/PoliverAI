export interface User {
  id: string;
  email: string;
  name: string;
  tier?: 'free' | 'pro';
  credits?: number;
  subscription_expires?: string | null;
}
