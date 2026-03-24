import type { Context, Next } from "hono";
import { logger } from "../utils/logger";

export async function errorHandler(c: Context, next: Next): Promise<Response> {
  try {
    await next();
    return c.res;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "不明なエラーが発生しました";
    const status = err instanceof Error && "status" in err
      ? (err as Error & { status: number }).status
      : 500;

    logger.error("APIエラー", {
      path: c.req.path,
      method: c.req.method,
      error: message,
      status,
    });

    return c.json(
      { error: "サーバーエラーが発生しました", details: message },
      status as 500,
    );
  }
}
