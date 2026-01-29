import "reflect-metadata";
import type { DeepPartial } from "typeorm";
import { AppDataSource } from "../../../datasource.ts";
import { PaymentField, PaymentPlatform } from "../../entities.ts";
import { ActiveInactiveStatus } from "../../enums.ts";

export async function runpaymentConfigSeederProd() {
  console.log("🌱 Seeding payment config...");

  await AppDataSource.initialize();

  try {
    const paymentPlatformRepo = AppDataSource.getRepository(PaymentPlatform);
    const paymentFieldRepo = AppDataSource.getRepository(PaymentField);

    await paymentPlatformRepo.upsert(
      {
        code: "FPX",
        name: "Bank Transfer",
        category: "manual",
        status: ActiveInactiveStatus.ACTIVE,
      },
      ["code"]
    );

    const platform = await paymentPlatformRepo.findOneByOrFail({
      code: "FPX",
    });

    const fields: DeepPartial<PaymentField>[] = [
      {
        key: "bank_name",
        label: "Bank Name",
        fieldtype: "text",
        required: true,
        paymentplatform: platform,
      },
      {
        key: "account_no",
        label: "Account No.",
        fieldtype: "text",
        required: true,
        paymentplatform: platform,
      },
    ];

    await paymentFieldRepo.upsert(fields, ["key", "paymentplatform"]);

    console.log("✔ Payment config seeded");
  } catch (error) {
    console.error("❌ Payment config seeding failed:", error);
  } finally {
    await AppDataSource.destroy();
  }
}
