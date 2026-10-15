import { useSelector } from "react-redux";
import type { RootState } from "@/store/store"; // adjust to your store path

export function useAuth() {
  const { token, user } = useSelector((state: RootState) => state.auth);
  return {
    user: user ?? null,
    token: token ?? null,
    isAuthenticated: !!token,
  };
}