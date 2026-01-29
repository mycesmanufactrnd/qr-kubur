import "reflect-metadata";
import type { DeepPartial } from "typeorm";
import { OrganisationType } from "../../entities.ts";
import { AppDataSource } from "../../../datasource.ts";
import { ActiveInactiveStatus } from "../../enums.ts";

export async function runOrganisationTypeSeederProd() {
  console.log("🌱 Seeding expanded organisation types...");

  await AppDataSource.initialize();

  try {
    const orgTypeRepo = AppDataSource.getRepository(OrganisationType);

    const orgTypesData: DeepPartial<OrganisationType>[] = [
        { 
            name: "Yayasan Negeri", 
            description: "Yayasan yang ditubuhkan oleh kerajaan negeri untuk tujuan kebajikan dan pembangunan", 
            status: ActiveInactiveStatus.ACTIVE 
        },
        { 
            name: "Majlis Agama Islam", 
            description: "Badan berkanun negeri yang mengurus hal ehwal Islam dan pembangunan masjid", 
            status: ActiveInactiveStatus.ACTIVE 
        },
        { 
            name: "Jawatankuasa Kariah", 
            description: "Jawatankuasa setempat yang mengurus pengurusan masjid dan tanah perkuburan kariah", 
            status: ActiveInactiveStatus.ACTIVE 
        },
        { 
            name: "Syarikat Swasta", 
            description: "Entiti perniagaan yang menyediakan perkhidmatan pengurusan jenazah secara komersial", 
            status: ActiveInactiveStatus.ACTIVE 
        },
        { 
            name: "Pertubuhan Kebajikan (NGO)", 
            description: "Organisasi bukan keuntungan yang fokus kepada kebajikan dan bantuan komuniti", 
            status: ActiveInactiveStatus.ACTIVE 
        },
        { 
            name: "Persatuan Sukarelawan", 
            description: "Organisasi yang dijalankan oleh sukarelawan untuk aktiviti sosial dan bantuan komuniti", 
            status: ActiveInactiveStatus.ACTIVE 
        },
        { 
            name: "Badan Masjid", 
            description: "Badan rasmi yang mengurus operasi, pentadbiran, dan aktiviti masjid setempat", 
            status: ActiveInactiveStatus.ACTIVE 
        }
    ];


    for (const item of orgTypesData) {
      await orgTypeRepo.upsert(item, ["name"]);
    }

    console.log("✔ Organisation types seeding completed.");
  } catch (error) {
    console.error("❌ Organisation type seeding failed:", error);
  } finally {
    await AppDataSource.destroy();
  }
}
