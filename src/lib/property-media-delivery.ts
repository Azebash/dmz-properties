import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

const contentTypes: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function deliverPropertyMedia(storagePath: string) {
  const extension = storagePath.split(".").at(-1) || "";
  const contentType = contentTypes[extension];
  if (!contentType) return new Response(null, { status: 404 });

  const { data, error } = await createServiceClient().storage.from("property-media")
    .download(storagePath);
  if (error || !data) return new Response(null, { status: 404 });
  return new Response(await data.arrayBuffer(), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
    },
  });
}
