import "reflect-metadata";
import { AppDataSource } from "../../datasource.ts";
import { Organisation, OrganisationType } from "../entities.ts";
import { ActiveInactiveStatus } from "../enums.ts";

export async function runOrganisationSeeder() {
  console.log("🌱 Seeding organisations for all states...");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const orgRepo = AppDataSource.getRepository(Organisation);
  const typeRepo = AppDataSource.getRepository(OrganisationType);

  // Helper to fetch types created in the previous seeder
  const maisType = await typeRepo.findOneBy({ name: "Majlis Agama Islam" });
  const yayasanType = await typeRepo.findOneBy({ name: "Yayasan Negeri" });
  const ngoType = await typeRepo.findOneBy({ name: "Pertubuhan Kebajikan (NGO)" });

  const dummyOrgs = [
    {
      name: "MAJLIS AGAMA ISLAM JOHOR (MAIJ)",
      states: ["Johor"],
      address: "Pusat Islam Iskandar Johor, Johor Bahru",
      email: "info@maij.gov.my",
      coords: [1.4655, 103.7578],
      type: maisType
    },
    {
      name: "MAJLIS AGAMA ISLAM KEDAH (MAIK)",
      states: ["Kedah"],
      address: "Alor Setar, Kedah",
      email: "admin@maik.gov.my",
      coords: [6.1184, 100.3686],
      type: maisType
    },
    {
      name: "MAJLIS AGAMA ISLAM KELANTAN (MAIK)",
      states: ["Kelantan"],
      address: "Kota Bharu, Kelantan",
      email: "info@maik.com.my",
      coords: [6.1254, 102.2386],
      type: maisType
    },
    {
      name: "MAJLIS AGAMA ISLAM MELAKA (MAIM)",
      states: ["Melaka"],
      address: "Pusat Islam Melaka, Bukit Palah",
      email: "maim@melaka.gov.my",
      coords: [2.1896, 102.2501],
      type: maisType
    },
    {
      name: "YAYASAN ISLAM NEGERI SEMBILAN",
      states: ["Negeri Sembilan"],
      address: "Seremban, Negeri Sembilan",
      email: "info@yins.gov.my",
      coords: [2.7258, 101.9424],
      type: yayasanType
    },
    {
      name: "MAJLIS UGAMA ISLAM PAHANG (MUIP)",
      states: ["Pahang"],
      address: "Pekan, Pahang",
      email: "muip@pahang.gov.my",
      coords: [3.4836, 103.3996],
      type: maisType
    },
    {
      name: "MAJLIS AGAMA ISLAM NEGERI PULAU PINANG (MAINPP)",
      states: ["Pulau Pinang"],
      address: "Georgetown, Pulau Pinang",
      email: "admin@mainpp.gov.my",
      coords: [5.4141, 100.3288],
      type: maisType
    },
    {
      name: "MAJLIS AGAMA ISLAM PERAK (MAIPk)",
      states: ["Perak"],
      address: "Ipoh, Perak",
      email: "info@maipk.gov.my",
      coords: [4.5975, 101.0901],
      type: maisType
    },
    {
      name: "MAJLIS AGAMA ISLAM PERLIS (MAIPs)",
      states: ["Perlis"],
      address: "Kangar, Perlis",
      email: "admin@maips.gov.my",
      coords: [6.4449, 100.1986],
      type: maisType
    },
    {
      name: "MAJLIS UGAMA ISLAM SABAH (MUIS)",
      states: ["Sabah"],
      address: "Kota Kinabalu, Sabah",
      email: "muis@sabah.gov.my",
      coords: [5.9788, 116.0753],
      type: maisType
    },
    {
      name: "MAJLIS ISLAM SARAWAK (MIS)",
      states: ["Sarawak"],
      address: "Kuching, Sarawak",
      email: "info@mis.sarawak.gov.my",
      coords: [1.5533, 110.3592],
      type: maisType
    },
    {
      name: "MAJLIS AGAMA ISLAM SELANGOR (MAIS)",
      states: ["Selangor"],
      address: "Shah Alam, Selangor",
      email: "pro@mais.gov.my",
      coords: [3.0733, 101.5185],
      type: maisType
    },
    {
      name: "MAJLIS AGAMA ISLAM TERENGGANU (MAIDAM)",
      states: ["Terengganu"],
      address: "Kuala Terengganu, Terengganu",
      email: "maidam@terengganu.gov.my",
      coords: [5.3302, 103.1408],
      type: maisType
    },
    {
      name: "MAJLIS AGAMA ISLAM WILAYAH PERSEKUTUAN (MAIWP)",
      states: ["Kuala Lumpur", "Putrajaya", "Labuan"],
      address: "Kuala Lumpur",
      email: "admin@maiwp.gov.my",
      coords: [3.1390, 101.6869],
      type: maisType
    },
    {
      name: "PERTUBUHAN KEBAJIKAN ISLAM MALAYSIA (PERKIM)",
      states: ["Selangor", "Kuala Lumpur"],
      address: "Jalan Ipoh, Kuala Lumpur",
      email: "info@perkim.net.my",
      coords: [3.1714, 101.6894],
      type: ngoType
    }
  ];

  for (const data of dummyOrgs) {
    const existing = await orgRepo.findOneBy({ name: data.name });
    
    if (!existing && data.type) {
      const newOrg = orgRepo.create({
        name: data.name,
        states: data.states, // Populates _text array
        address: data.address,
        phone: "03-12345678",
        email: data.email,
        url: `https://www.${data.email.split('@')[1]}`,
        latitude: data.coords[0],
        longitude: data.coords[1],
        canbedonated: true, // As required by schema
        status: ActiveInactiveStatus.ACTIVE,
        organisationtype: data.type, // Relation mapping
      });

      await orgRepo.save(newOrg);
    }
  }

  console.log(`✔ Successfully seeded ${dummyOrgs.length} organisations covering all states.`);
}