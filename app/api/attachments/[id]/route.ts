import { eq } from "drizzle-orm";
import { Readable } from "node:stream";

import { db } from "@/lib/db";
import { attachments } from "@/lib/db/schema";
import { readUpload, streamUpload } from "@/lib/uploads";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/attachments/[id]">,
) {
  const { id } = await ctx.params;

  const [row] = await db
    .select()
    .from(attachments)
    .where(eq(attachments.id, id))
    .limit(1);
  if (!row) return new Response("Not found", { status: 404 });

  const file = await readUpload(row.storageKey);
  if (!file) return new Response("Not found", { status: 404 });

  const nodeStream = streamUpload(file.path);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

  return new Response(webStream, {
    headers: {
      "Content-Type": row.mimeType,
      "Content-Length": String(file.size),
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": `inline; filename="${encodeURIComponent(
        row.originalName,
      )}"`,
    },
  });
}
