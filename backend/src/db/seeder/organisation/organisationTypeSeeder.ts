import "reflect-metadata";
import { AppDataSource } from "../../../datasource.ts";
import { ActiveInactiveStatus } from "../../enums.ts";
import { OrganisationType } from "../../entities.ts";

import { In } from "typeorm";

export async function runOrganisationTypeSeeder() {
  console.log("🌱 Seeding expanded organisation types...");

  if (!AppDataSource.isInitialized) await AppDataSource.initialize();
  const orgTypeRepo = AppDataSource.getRepository(OrganisationType);

  const orgTypesData = [
    { name: "Yayasan Negeri", description: "Yayasan buat negeri negeri dalam Malaysia", status: ActiveInactiveStatus.ACTIVE },
    { name: "Majlis Agama Islam", description: "Badan berkanun pengurusan hal ehwal Islam negeri", status: ActiveInactiveStatus.ACTIVE },
    { name: "Jawatankuasa Kariah", description: "Pengurusan kariah masjid dan tanah perkuburan lokal", status: ActiveInactiveStatus.ACTIVE },
    { name: "Syarikat Swasta", description: "Entiti perniagaan pengurusan jenazah swasta", status: ActiveInactiveStatus.ACTIVE },
    { name: "Pertubuhan Kebajikan (NGO)", description: "Organisasi sukarela bantuan komuniti", status: ActiveInactiveStatus.ACTIVE }
  ];

  for (const item of orgTypesData) {
    const exists = await orgTypeRepo.findOneBy({ name: item.name });
    if (!exists) {
      await orgTypeRepo.save(orgTypeRepo.create(item));
    }
  }

  console.log("✔ Organisation types seeding completed.");
}