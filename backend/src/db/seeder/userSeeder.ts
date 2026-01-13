import "reflect-metadata";
import crypto from "crypto";
import { AppDataSource } from "../../datasource.js";
import { User } from "../entities/User.entity.js";
import type { DeepPartial } from "typeorm";

export async function runUserSeeder() {
  console.log("🌱 Seeding users...");

  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);

  const adminExists = await userRepo.findOne({
    where: { email: "admin@qr-kubur.com" },
  });

  if (adminExists) {
    console.log("✔ Users already seeded");
    return;
  }

  const inputPassword = "password";
  const hashedPassword = crypto.createHash("sha256").update(inputPassword).digest("hex");

  const superadmin: DeepPartial<User> = {
    fullname: "Super Admin",
    email: "admin@qr-kubur.com",
    password: hashedPassword,
    role: "superadmin",
    states: ["Johor", "Selangor"],
    organisation: null,
    tahfizcenter: null,
  };

  const ainulUser: DeepPartial<User> = {
    fullname: "AINUL SYUHADAH BINTI HAMDAN",
    email: "ainulhamdans@gmail.com",
    password: hashedPassword,
    role: "superadmin",
    states: ["Selangor"],
    organisation: null,
    tahfizcenter: null,
  };

  const adminEntity = userRepo.create([superadmin, ainulUser]);
  await userRepo.save(adminEntity);

  console.log("✔ Users seeded");
}