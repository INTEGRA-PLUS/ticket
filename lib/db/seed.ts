import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import * as schema from "./schema";
import { generatePublicId } from "../public-id";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const client = postgres(url, { prepare: false, max: 1 });
  const db = drizzle(client, { schema });

  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin12345";
  const name = process.env.SEED_ADMIN_NAME ?? "Default Admin";

  console.log(`Seeding admin user: ${email}`);

  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  let admin = existing[0];
  if (!admin) {
    const passwordHash = await bcrypt.hash(password, 10);
    const [created] = await db
      .insert(schema.users)
      .values({ email, name, passwordHash })
      .returning();
    admin = created;
    console.log(`  created admin (${admin.id})`);
  } else {
    console.log(`  admin already exists, skipping`);
  }

  const ticketsCount = await db.$count(schema.tickets);
  if (ticketsCount > 0) {
    console.log(`Skipping ticket seed: ${ticketsCount} already present.`);
    await client.end();
    return;
  }

  const samples: schema.NewTicket[] = [
    {
      publicId: generatePublicId(),
      subject: "Cannot reset password",
      description:
        "I tried the forgot-password link three times and the email never arrived.",
      customerName: "Ada Lovelace",
      customerEmail: "ada@example.com",
      status: "open",
      priority: "high",
      assignedToId: admin.id,
    },
    {
      publicId: generatePublicId(),
      subject: "Invoice charged twice",
      description:
        "We were billed twice on April 12. Please refund the duplicate charge.",
      customerName: "Grace Hopper",
      customerEmail: "grace@example.com",
      status: "in_progress",
      priority: "urgent",
      assignedToId: admin.id,
    },
    {
      publicId: generatePublicId(),
      subject: "Feature request: dark mode",
      description: "Would love a dark theme for the dashboard.",
      customerName: "Linus Torvalds",
      customerEmail: "linus@example.com",
      status: "waiting_customer",
      priority: "low",
      assignedToId: admin.id,
    },
    {
      publicId: generatePublicId(),
      subject: "API returning 500",
      description:
        "Calls to /v1/orders intermittently return 500 since this morning.",
      customerName: "Margaret Hamilton",
      customerEmail: "margaret@example.com",
      status: "open",
      priority: "urgent",
      assignedToId: admin.id,
    },
    {
      publicId: generatePublicId(),
      subject: "Update billing email",
      description: "Please change our billing contact to billing@acme.test.",
      customerName: "Acme Corp",
      customerEmail: "ops@acme.test",
      status: "resolved",
      priority: "medium",
      assignedToId: admin.id,
    },
  ];

  await db.insert(schema.tickets).values(samples);
  console.log(`  inserted ${samples.length} sample tickets`);

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
