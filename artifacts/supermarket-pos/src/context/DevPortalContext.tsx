import { createContext, useContext } from "react";

interface DevPortalCtxValue {
  apiBase: string;
  devHeaders: Record<string, string>;
}

export const DevPortalCtx = createContext<DevPortalCtxValue>({
  apiBase: "/api/superadmin",
  devHeaders: {},
});

export function useDevPortal() {
  return useContext(DevPortalCtx);
}
