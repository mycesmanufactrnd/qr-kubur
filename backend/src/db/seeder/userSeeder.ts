import "reflect-metadata";
import crypto from "crypto";
import { AppDataSource } from "../../datasource.js";
import { User } from "../entities/User.entity.js";
import type { DeepPartial } from "typeorm";

export async function runUserSeeder() {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);

  const adminExists = await userRepo.findOne({
    where: { email: "admin@qr-kubur.com" },
  });

  if (adminExists) {
    console.log("Users already seeded");
    return;
  }

  const inputPassword = "password"; // or whatever input you have
  const hashedPassword = crypto.createHash("sha256").update(inputPassword).digest("hex");

  const superadmin: DeepPartial<User> = {
    fullname: "Super Admin",
    email: "admin@qr-kubur.com",
    password: hashedPassword,
    role: "superadmin",
    state: ["Johor", "Selangor"],
    organisation: null,
    tahfizcenter: null,
  };

  const ainulUser: DeepPartial<User> = {
  fullname: "AINUL SYUHADAH BINTI HAMDAN",
  email: "ainulhamdans@gmail.com",
  password: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8", // Pre-hashed
  role: "superadmin", // Or "admin" depending on the access you want
  state: ["Selangor"],
  organisation: null,
  tahfizcenter: null,
  };

  const adminEntity = userRepo.create([superadmin, ainulUser]);
  await userRepo.save(adminEntity);

  console.log("✔ Users seeded");
}