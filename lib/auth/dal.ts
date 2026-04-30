import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import type { SessionPayload } from "./session";

export const verifySession = cache(async (): Promise<SessionPayload> => {
  // Return the first user as a mock session to "remove" authentication
  const [user] = await db.select().from(users).limit(1);
  
  const oneWeekFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;

  if (!user) {
    // Fallback in case there are no users at all, though seed should have created one
    return {
      userId: "00000000-0000-0000-0000-000000000000",
      email: "guest@example.com",
      name: "Guest",
      expiresAt: oneWeekFromNow,
    };
  }

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    expiresAt: oneWeekFromNow,
  };
});

export const getOptionalSession = cache(async () => {
  return verifySession();
});
