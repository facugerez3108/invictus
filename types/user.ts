export type UserRow = {
  id: string;
  username: string;
  role: "ADMIN" | "USER";
  createdAt: string;
  updatedAt: string;
};