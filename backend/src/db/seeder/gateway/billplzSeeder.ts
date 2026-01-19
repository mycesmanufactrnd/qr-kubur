// seeders/billplzSeeder.ts
import { AppDataSource } from "../../../datasource.ts";
import { PaymentPlatform, PaymentField } from "../../../db/entities.ts";
import { ActiveInactiveStatus } from "../../../db/enums.ts";

export async function runBillplzSeeder() {
  const platformRepo = AppDataSource.getRepository(PaymentPlatform);
  const fieldRepo = AppDataSource.getRepository(PaymentField);

  // Check if it already exists to avoid duplicates
  const existing = await platformRepo.findOneBy({ code: "billplz_sandbox" });
  if (existing) {
    console.log("✔ Billplz Sandbox platform already exists.");
    return;
  }

  console.log("🌱 Seeding Billplz Payment Platform...");

  // 1. Create the Platform with ALL required fields
  const platform = platformRepo.create({
    code: "billplz_sandbox", // Unique identifier
    name: "Billplz Sandbox",
    category: "gateway",      // Required field per entity
    status: ActiveInactiveStatus.ACTIVE,
  });
  const savedPlatform = await platformRepo.save(platform);

  // 2. Add Credentials as PaymentFields with required keys
  const fields = [
    { 
      key: "API_KEY", 
      label: "API Key", 
      fieldtype: "text", 
      required: true, 
      paymentplatform: savedPlatform 
    },
    { 
      key: "COLLECTION_ID", 
      label: "Collection ID", 
      fieldtype: "text", 
      required: true, 
      paymentplatform: savedPlatform 
    },
    { 
      key: "X_SIGNATURE", 
      label: "X-Signature Key", 
      fieldtype: "password", 
      required: true, 
      paymentplatform: savedPlatform 
    }
  ];

  await fieldRepo.save(fieldRepo.create(fields));
  console.log("✔ Billplz Sandbox platform and fields seeded successfully.");
}