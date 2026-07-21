import { Hono } from "hono";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../lib/s3";
import { authMiddleware, requireAuth } from "../middleware/auth";

export const upload = new Hono()
  .use("*", authMiddleware, requireAuth)
  .post("/presign", async (c) => {
    const { filename, contentType } = await c.req.json<{ filename: string; contentType: string }>();
    const key = `receipts/${Date.now()}-${filename}`;

    const url = await getSignedUrl(
      s3,
      new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, ContentType: contentType }),
      { expiresIn: 600 }
    );

    return c.json({ url, key }, 200);
  })
  .get("/view", async (c) => {
    const key = c.req.query("key");
    if (!key) return c.json({ message: "key requis" }, 400);
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
      { expiresIn: 3600 }
    );
    return c.json({ url }, 200);
  });
