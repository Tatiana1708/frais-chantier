import { Hono } from "hono";
import { authMiddleware, requireAuth, AuthEnv } from "../middleware/auth";

export const users = new Hono<AuthEnv>()
  .use("*", authMiddleware, requireAuth)
  .get("/me", async (c) => {
    const user = c.get("user")!;
    return c.json({ user }, 200);
  });
