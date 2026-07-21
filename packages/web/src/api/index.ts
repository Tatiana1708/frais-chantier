import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "./auth";
import { chantiers } from "./routes/chantiers";
import { categories } from "./routes/categories";
import { expenses } from "./routes/expenses";
import { upload } from "./routes/upload";
import { exportRoutes } from "./routes/export";
import { users } from "./routes/users";

const app = new Hono()
  .use(cors({ origin: (origin) => origin ?? "*", credentials: true, exposeHeaders: ["set-auth-token"] }))
  .on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw))
  .basePath("api")
  .get("/health", (c) => c.json({ status: "ok" }, 200))
  .route("/chantiers", chantiers)
  .route("/categories", categories)
  .route("/expenses", expenses)
  .route("/upload", upload)
  .route("/export", exportRoutes)
  .route("/users", users);

export type AppType = typeof app;
export default app;
