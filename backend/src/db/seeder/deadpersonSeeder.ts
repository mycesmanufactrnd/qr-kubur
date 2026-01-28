import "reflect-metadata";
import { AppDataSource } from "../../datasource.ts";
import { DeadPerson, Grave } from "../entities.ts";

export async function runDeadPersonSeeder() {
  console.log("🌱 Seeding deceased persons for Selangor graves...");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const graveRepo = AppDataSource.getRepository(Grave);
  const deadPersonRepo = AppDataSource.getRepository(DeadPerson);

  const selangorGraves = await graveRepo.find({
    where: { state: "Selangor" },
    relations: ["deadPerson"] 
  });

  if (selangorGraves.length === 0) {
    console.log("⚠️ No Selangor graves found. Please run the Grave seeder first.");
    return;
  }

  const dummyNames = [
    "Ahmad bin Abdullah",
    "Fatimah binti Hassan",
    "Mohd Ridzuan bin Ismail",
    "Siti Aminah binti Kassim",
    "Abdul Rahman bin Hamid",
    "Zaiton binti Mohd Yusof",
    "Khairul Azman bin Bakri",
    "Noraini binti Sulaiman",
    "Mustafa bin Ibrahim",
    "Hajah Rohana binti Zainal"
  ];

  const newPersons: DeadPerson[] = [];

  for (let i = 0; i < selangorGraves.length; i++) {
    const grave = selangorGraves[i];

    const existingCount = await deadPersonRepo.count({
      where: { grave: { id: grave.id } }
    });

    if (existingCount > 0) {
      continue;
    }

    const person = deadPersonRepo.create({
      name: dummyNames[i % dummyNames.length],
      icnumber: `${70 + i}0101-10-${5000 + i}`,
      dateofbirth: new Date(1940 + i, 0, 1),
      dateofdeath: new Date(2020, 5, 15 + i),
      causeofdeath: i % 2 === 0 ? "Sakit Tua" : "Komplikasi Jantung",
      biography: `Allahyarham merupakan seorang yang sangat berjasa di kawasan ${grave.name}.`,
      photourl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(dummyNames[i % dummyNames.length])}`,
      grave: grave,
      latitude: grave.latitude,
      longitude: grave.longitude
    });

    newPersons.push(person);
  }

  if (newPersons.length === 0) {
    console.log("✔ All Selangor graves already have deceased person records.");
    return;
  }

  await deadPersonRepo.save(newPersons);
  console.log(`✔ Successfully seeded ${newPersons.length} dummy deceased person records.`);
}