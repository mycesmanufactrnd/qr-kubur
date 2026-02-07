import "reflect-metadata";
import crypto from "crypto";
import { AppDataSource } from "../../datasource.js";
import { User } from "../entities/User.entity.js";
import type { DeepPartial } from "typeorm";

/**
 * Standardized User Seeder
 * Includes Superadmins and a Standard Admin for testing.
 */
export async function runUserSeeder() {
  console.log("🌱 Seeding users...");

  // Ensure Data Source is ready
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const userRepo = AppDataSource.getRepository(User);

  // 🔹 1. Check for the NEW Admin email to determine if we should seed
  // We use the new admin email as the anchor point for this update.
  const adminExists = await userRepo.findOne({
    where: { email: "admin@example.com" },
  });

  if (adminExists) {
    console.log("✔ Users already seeded (admin@example.com exists)");
    return;
  }

  const inputPassword = "password";
  const hashedPassword = crypto.createHash("sha256").update(inputPassword).digest("hex");

  // 🔹 2. Define User Data
  const userData: DeepPartial<User>[] = [
    {
      fullname: "Super Admin",
      email: "admin@qr-kubur.com",
      password: hashedPassword,
      role: "superadmin",
      states: ["Johor", "Selangor"],
      organisation: null,
      tahfizcenter: null,
    },
    {
      fullname: "AINUL SYUHADAH BINTI HAMDAN",
      email: "ainulhamdans@gmail.com",
      password: hashedPassword,
      role: "superadmin",
      states: ["Selangor"],
      organisation: null,
      tahfizcenter: null,
    },
    {
      fullname: "System Admin",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
      states: ["Selangor"],
      organisation: null,
      tahfizcenter: null,
    }
  ];

  // 🔹 3. Logic to handle partial seeding
  // We loop through to see which specific users are missing
  for (const user of userData) {
    const exists = await userRepo.findOne({ where: { email: user.email } });
    
    if (!exists) {
      const newUser = userRepo.create(user);
      await userRepo.save(newUser);
      console.log(`+ Created user: ${user.email}`);
    } else {
      console.log(`- User already exists: ${user.email}`);
    }
  }

  console.log("✔ User seeding process completed.");
}