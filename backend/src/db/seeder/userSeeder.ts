{/*

  What reflect-metadata does?

  It allows TypeORM to read this at runtime:

  class User {
    @Column()
    name: string;
  }

  Without reflect-metadata, JavaScript sees:

  class User {
    name;   // no type info exists
  }

*/}

import "reflect-metadata";
import { AppDataSource } from "../../datasource.ts";
import bcrypt from "bcrypt";
import { User } from "../entities/User.entity.ts";
import type { DeepPartial } from "typeorm"; 

await AppDataSource.initialize();

const userRepo = AppDataSource.getRepository(User);

const adminExists = await userRepo.findOne({
  where: { email: "admin@qr-kubur.com" },
});

if (adminExists) {
  console.log("Users already seeded");
  process.exit(0);
}

const superadmin: DeepPartial<User> = {
  fullname: "Super Admin",
  email: "admin@qr-kubur.com",
  password: await bcrypt.hash("password", 10),
  role: "superadmin",
  state: ["Johor", "Selangor"],
  organisation: null,
  tahfizcenter: null,
};

const adminEntity = userRepo.create(superadmin);
await userRepo.save(adminEntity);

console.log("✔ Users seeded");
process.exit(0);
