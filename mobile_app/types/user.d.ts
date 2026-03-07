// mobile_app\types\user.d.ts

export interface User {
  _id: string;
  name: string;
  email: string;
  provider: string;
  googleId?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}
