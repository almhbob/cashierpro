import type { Tenant } from "@workspace/db";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      tenantId?: string;
      tenant?: Tenant;
    }
  }
}

export {};
