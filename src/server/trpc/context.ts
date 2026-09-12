import { auth } from "@/server/auth";
import { db } from "@/server/db/client";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export async function createTRPCContext(opts?: FetchCreateContextFnOptions) {
  const session = await auth();

  return {
    db,
    session,
    user: session?.user ?? null,
    headers: opts?.req.headers,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
