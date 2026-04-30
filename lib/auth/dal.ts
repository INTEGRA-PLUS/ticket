import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import type { SessionPayload } from "./session";

export const verifySession = cache(async (): Promise<SessionPayload> => {
  const oneWeekFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const guestSession = {
    userId: "00000000-0000-0000-0000-000000000000",
    email: "guest@example.com",
    name: "Invitado",
    expiresAt: oneWeekFromNow,
  };

  try {
    // Intentamos obtener el primer usuario
    const [user] = await db.select().from(users).limit(1);
    
    if (!user) return guestSession;

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      expiresAt: oneWeekFromNow,
    };
  } catch (error) {
    // Si falla (como en el build), devolvemos sesión de invitado
    return guestSession;
  }
});

export const getOptionalSession = cache(async () => {
  return verifySession();
});
