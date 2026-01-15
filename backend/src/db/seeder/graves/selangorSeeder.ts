import "reflect-metadata";
import { AppDataSource } from "../../../datasource.ts";
import { Grave } from "../../entities.ts";
import { ActiveInactiveStatus } from "../../enums.ts";
import { In } from "typeorm";

export async function runSelangorGraveSeeder() {
  console.log("🌱 Seeding Selangor graves...");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const graveRepo = AppDataSource.getRepository(Grave);

  const gravesData = [
    {
      name: "Tanah Perkuburan Islam Seksyen 21 Shah Alam",
      state: "Selangor",
      latitude: 3.062449863914631,
      longitude: 101.55059431717139,
      status: ActiveInactiveStatus.ACTIVE,
    },
    {
      name: "Tanah Perkuburan Islam USJ 22 Subang Jaya",
      state: "Selangor",
      latitude: 3.0315809706399435,
      longitude: 101.57943265780526,
      status: ActiveInactiveStatus.ACTIVE,
    },
    {
      name: "Tanah Perkuburan Islam Raudhatul Baqi' Cyberjaya",
      state: "Selangor",
      latitude: 2.8995146680623916,
      longitude: 101.63107432274089,
      status: ActiveInactiveStatus.ACTIVE,
    },
    {
      name: "Tanah Perkuburan Islam Kampung Tunku PJ",
      state: "Selangor",
      latitude: 3.098235492100827,
      longitude: 101.6225123405958,
      status: ActiveInactiveStatus.ACTIVE,
    },
    {
      name: "Tanah Perkuburan Islam Kota Damansara (Seksyen 9)",
      state: "Selangor",
      latitude: 3.170642109852134,
      longitude: 101.5791345678912,
      status: ActiveInactiveStatus.ACTIVE,
    },
    {
      name: "Tanah Perkuburan Islam Meru Klang",
      state: "Selangor",
      latitude: 3.138498210345678,
      longitude: 101.4422345678901,
      status: ActiveInactiveStatus.ACTIVE,
    },
    {
      name: "Tanah Perkuburan Islam Bukit Tandang PJS 5",
      state: "Selangor",
      latitude: 3.078234567890123,
      longitude: 101.6154321098765,
      status: ActiveInactiveStatus.ACTIVE,
    },
    {
      name: "Tanah Perkuburan Islam Semenyih",
      state: "Selangor",
      latitude: 2.948298765432109,
      longitude: 101.8431098765432,
      status: ActiveInactiveStatus.ACTIVE,
    },
    {
      name: "Tanah Perkuburan Islam Keramat Permai AU2",
      state: "Selangor",
      latitude: 3.176432109876543,
      longitude: 101.7456789012345,
      status: ActiveInactiveStatus.ACTIVE,
    },
    {
      name: "Tanah Perkuburan Islam Selayang Baru",
      state: "Selangor",
      latitude: 3.255850123456789,
      longitude: 101.6732109876543,
      status: ActiveInactiveStatus.ACTIVE,
    }
  ];

  const names = gravesData.map(g => g.name);
  
  const existingGraves = await graveRepo.find({
    where: { name: In(names) },
    select: ["name"]
  });

  const existingNames = existingGraves.map(g => g.name);

  const newGravesData = gravesData.filter(g => !existingNames.includes(g.name));

  if (newGravesData.length === 0) {
    console.log("✔ All Selangor graves already exist in database.");
    return;
  }

  const graves = graveRepo.create(newGravesData);
  await graveRepo.save(graves);

  console.log(`✔ Seeded ${newGravesData.length} new Selangor grave locations.`);
}