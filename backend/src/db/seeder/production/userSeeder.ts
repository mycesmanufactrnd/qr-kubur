import "reflect-metadata";
import crypto from "crypto";
import type { DeepPartial } from "typeorm";
import { AppDataSource } from "../../../datasource.js";
import { User } from "../../entities.js";

const STATES_MY = [
  "Federal", "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan",
  "Pahang", "Perak", "Perlis", "Pulau Pinang", "Sabah", "Sarawak",
  "Selangor", "Terengganu", "Wilayah Persekutuan",
];

export async function runUserSeederProd() {
  console.log("🌱 Seeding users...");

  await AppDataSource.initialize();

  try {
    const userRepo = AppDataSource.getRepository(User);

    const existingUser = await userRepo.findOne({
      where: [
        { username: "superadmin@qrkubur.com" },
        { username: "admin@qrkubur.com" },
      ],
    });

    if (existingUser) {
      console.log("✔ Users already seeded");
      return;
    }

    const hashedPassword = crypto
      .createHash("sha256")
      .update("password")
      .digest("hex");

    const users: DeepPartial<User>[] = [
      {
        fullname: "Super Admin",
        username: "superadmin@qrkubur.com",
        email: "superadmin@qrkubur.com",
        password: hashedPassword,
        role: "superadmin",
        states: STATES_MY,
        organisation: null,
        tahfizcenter: null,
      },
      {
        fullname: "Admin",
        username: "admin@qrkubur.com",
        email: "admin@qrkubur.com",
        password: hashedPassword,
        role: "admin",
        states: STATES_MY,
        organisation: null,
        tahfizcenter: null,
      },
    ];

    await userRepo.save(userRepo.create(users));

    console.log("✔ Users seeded");
  } catch (error) {
    console.error("❌ Users seeding failed:", error);
  } finally {
    await AppDataSource.destroy();
  }
}
