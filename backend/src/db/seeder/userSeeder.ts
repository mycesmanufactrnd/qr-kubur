import { db } from "../index.ts";
import { users } from "../schemas/users.ts";
import bcrypt from "bcrypt";

const adminExists = await db.select().from(users).limit(1);
if (adminExists.length) {
  console.log("⏩ Users already seeded");
  process.exit(0);
}

await db.insert(users).values({
    fullName: "Super Admin",
    email: "admin@qr-kubur.com",
    password: await bcrypt.hash("password", 10),
    role: "superadmin",
    organisationId: null,
    tahfizCenterId: null,
    state: ["Johor"],
});

console.log("✔ Users seeded");
