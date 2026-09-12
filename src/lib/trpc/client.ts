import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/server/trpc/routers/_app";
import superjson from "superjson";

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      transformer: superjson,
      url: "/api/trpc",
    }),
  ],
});
