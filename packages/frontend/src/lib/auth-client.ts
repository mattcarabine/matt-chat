import { createAuthClient } from 'better-auth/react';
import { usernameClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || '',
  plugins: [usernameClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;

// Custom user type that includes our additional fields
export interface User {
  id: string;
  email: string;
  name: string;
  fullName?: string;
  username?: string;
  displayUsername?: string;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
