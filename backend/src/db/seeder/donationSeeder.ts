import "reflect-metadata";
import { AppDataSource } from "../../datasource.ts";
import { Donation, Organisation, TahfizCenter } from "../../db/entities.ts";
import { VerificationStatus } from "../../db/enums.ts";

export async function runDonationSeeder() {
  console.log("🌱 Seeding dummy donations...");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const donationRepo = AppDataSource.getRepository(Donation);
  const orgRepo = AppDataSource.getRepository(Organisation);
  const tahfizRepo = AppDataSource.getRepository(TahfizCenter);

  // 1. Fetch existing targets for the donations
  const organisations = await orgRepo.find({ take: 5 });
  const tahfizCenters = await tahfizRepo.find({ take: 5 });

  if (organisations.length === 0 || tahfizCenters.length === 0) {
    console.log("⚠️ Targets not found. Run Organisation and Tahfiz seeders first.");
    return;
  }

  const dummyDonations = [
    // Donations to Organisations
    {
      donorname: "Ahmad Zaki",
      donoremail: "zaki@email.com",
      amount: 150.00,
      organisation: organisations[0],
      status: VerificationStatus.VERIFIED,
      notes: "Sumbangan ikhlas untuk pembangunan wakaf."
    },
    {
      donorname: "Siti Sarah",
      donoremail: "sarah@email.com",
      amount: 50.00,
      organisation: organisations[1],
      status: VerificationStatus.PENDING,
      notes: "test" // Matching your database screenshot example
    },
    // Donations to Tahfiz Centers
    {
      donorname: "Haji Ibrahim",
      donoremail: "ibrahim@email.com",
      amount: 500.00,
      tahfizcenter: tahfizCenters[0],
      status: VerificationStatus.VERIFIED,
      notes: "Infaq untuk makanan pelajar tahfiz."
    },
    {
      donorname: "Anonymous",
      donoremail: null,
      amount: 25.00,
      tahfizcenter: tahfizCenters[1],
      status: VerificationStatus.REJECTED,
      notes: "Sumbangan bulanan."
    },
    {
      donorname: "Fatimah Osman",
      donoremail: "fatimah@email.com",
      amount: 100.00,
      tahfizcenter: tahfizCenters[2],
      status: VerificationStatus.PENDING,
      notes: "Untuk kegunaan pengurusan."
    }
  ];

  for (const data of dummyDonations) {
    // Check for existing donation from same donor for same amount/target to avoid exact duplicates
    const existing = await donationRepo.findOneBy({
      donorname: data.donorname,
      amount: data.amount,
      notes: data.notes
    });

    if (!existing) {
      const newDonation = donationRepo.create(data);
      await donationRepo.save(newDonation);
    }
  }

  console.log(`✔ Seeded ${dummyDonations.length} dummy donation records.`);
}