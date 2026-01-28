import { In } from "typeorm";
import { AppDataSource } from "../../datasource.ts";
import { Grave } from "../entities.ts";
import { ActiveInactiveStatus } from "../enums.ts";

export async function runGraveSeeder() {
  console.log("🌱 Seeding graves...");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const graveRepo = AppDataSource.getRepository(Grave);

  const gravesData = [
    // Johor
    {
      name: "Tanah Perkuburan Islam Sungai Rinting",
      state: "Johor",
      latitude: 1.5803,
      longitude: 103.7781,
      status: ActiveInactiveStatus.ACTIVE,
    },
    // Kedah
    {
      name: "Tanah Perkuburan Islam Kubang Pasu",
      state: "Kedah",
      latitude: 6.4446,
      longitude: 100.3860,
      status: ActiveInactiveStatus.ACTIVE,
    },
    // Kelantan
    {
      name: "Tanah Perkuburan Islam Ketereh",
      state: "Kelantan",
      latitude: 6.1047,
      longitude: 102.2408,
      status: ActiveInactiveStatus.ACTIVE,
    },
    // Kuala Lumpur (Federal Territory)
    {
      name: "Tanah Perkuburan Islam Batu",
      state: "Kuala Lumpur",
      latitude: 3.2472,
      longitude: 101.6903,
      status: ActiveInactiveStatus.ACTIVE,
    },
    // Melaka
    {
      name: "Tanah Perkuburan Islam Cheng",
      state: "Melaka",
      latitude: 2.2385,
      longitude: 102.2443,
      status: ActiveInactiveStatus.ACTIVE,
    },
    // Negeri Sembilan
    {
      name: "Tanah Perkuburan Islam Sikamat",
      state: "Negeri Sembilan",
      latitude: 2.7121,
      longitude: 101.9379,
      status: ActiveInactiveStatus.ACTIVE,
    },
    // Pahang
    {
      name: "Tanah Perkuburan Islam Taman Tas",
      state: "Pahang",
      latitude: 3.7968,
      longitude: 103.3242,
      status: ActiveInactiveStatus.ACTIVE,
    },
    // Penang
    {
      name: "Tanah Perkuburan Islam Sungai Nibong",
      state: "Penang",
      latitude: 5.3265,
      longitude: 100.3030,
      status: ActiveInactiveStatus.ACTIVE,
    },
    // Perak
    {
      name: "Tanah Perkuburan Islam Taiping",
      state: "Perak",
      latitude: 4.8536,
      longitude: 100.7378,
      status: ActiveInactiveStatus.ACTIVE,
    },
    // Perlis
    {
      name: "Tanah Perkuburan Islam Kangar",
      state: "Perlis",
      latitude: 6.4450,
      longitude: 100.1993,
      status: ActiveInactiveStatus.ACTIVE,
    },
    // Putrajaya (Federal Territory)
    {
      name: "Tanah Perkuburan Islam Putrajaya",
      state: "Putrajaya",
      latitude: 2.9244,
      longitude: 101.6972,
      status: ActiveInactiveStatus.ACTIVE,
    },
    // Sabah
    {
      name: "Tanah Perkuburan Islam Likas",
      state: "Sabah",
      latitude: 5.9845,
      longitude: 116.0733,
      status: ActiveInactiveStatus.ACTIVE,
    },
    // Sarawak
    {
      name: "Tanah Perkuburan Islam Igan",
      state: "Sarawak",
      latitude: 1.3977,
      longitude: 110.3250,
      status: ActiveInactiveStatus.ACTIVE,
    },
    // Selangor
    {
      name: "Tanah Perkuburan Islam Shah Alam Seksyen 21",
      state: "Selangor",
      latitude: 3.0624,
      longitude: 101.5506,
      status: ActiveInactiveStatus.ACTIVE,
    },
    // Terengganu
    {
      name: "Tanah Perkuburan Islam Kuala Terengganu",
      state: "Terengganu",
      latitude: 5.3300,
      longitude: 103.1361,
      status: ActiveInactiveStatus.ACTIVE,
    },
  ];

  const names = gravesData.map(g => g.name);

  const existingGraves = await graveRepo.find({
    where: { name: In(names) },
    select: ["name"],
  });

  const existingNames = existingGraves.map(g => g.name);

  const newGravesData = gravesData.filter(g => !existingNames.includes(g.name));

  if (newGravesData.length === 0) {
    console.log("✔ All graves already exist in database.");
    return;
  }

  const graves = graveRepo.create(newGravesData);
  await graveRepo.save(graves);

  console.log(`✔ Seeded ${newGravesData.length} new grave locations.`);
}
