import "reflect-metadata";
import { AppDataSource } from "../../datasource"; // Path to your AppDataSource
import { Mosque } from "../entities"; 

export async function runMosqueSeeder() {
  console.log("🌱 Seeding 10 Mosques...");

  // Ensure DataSource is ready
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const mosqueRepo = AppDataSource.getRepository(Mosque);

  const mosqueData = [
    {
      name: "Masjid Negara",
      state: "Kuala Lumpur",
      address: "Jalan Perdana, Kuala Lumpur",
      phone: "03-26937905",
      email: "info@masjidnegara.gov.my",
      url: "https://www.masjidnegara.gov.my",
      latitude: 3.1412,
      longitude: 101.6865,
      photourl: "",
    },
    {
      name: "Masjid Sultan Salahuddin Abdul Aziz Shah",
      state: "Selangor",
      address: "Persiaran Masjid, Shah Alam, Selangor",
      phone: "03-55199988",
      email: "admin@mssaas.gov.my",
      url: "https://www.mssaas.gov.my",
      latitude: 3.0732,
      longitude: 101.5183,
      photourl: "",
    },
    {
      name: "Masjid Putra",
      state: "Putrajaya",
      address: "Presint 1, Putrajaya",
      phone: "03-88885678",
      email: "korporat@masjidputra.gov.my",
      url: "https://www.masjidputra.gov.my",
      latitude: 2.9256,
      longitude: 101.6966,
      photourl: "",
    },
    {
      name: "Masjid Kristal",
      state: "Terengganu",
      address: "Pulau Wan Man, Kuala Terengganu",
      phone: "09-6271111",
      email: "info@masjidkristal.com",
      url: "https://www.tti.com.my",
      latitude: 5.3302,
      longitude: 103.1408,
      photourl: "",
    },
    {
      name: "Masjid Negeri Kuching",
      state: "Sarawak",
      address: "Kuching, Sarawak",
      phone: "082-243224",
      email: "info@masjidnegeri.sarawak.gov.my",
      url: "",
      latitude: 1.5543,
      longitude: 110.3592,
      photourl: "",
    },
    {
      name: "Masjid Al-Osmani",
      state: "Johor",
      address: "Jalan Masjid, Johor Bahru",
      phone: "07-2234455",
      email: "admin@masjid-osmani.my",
      url: "",
      latitude: 1.4927,
      longitude: 103.7413,
      photourl: "",
    },
    {
      name: "Masjid Tengku Ampuan Jemaah",
      state: "Selangor",
      address: "Section 14, Shah Alam",
      phone: "03-55100000",
      email: "contact@mtaj.my",
      url: "",
      latitude: 3.0689,
      longitude: 101.5181,
      photourl: "",
    },
    {
      name: "Masjid Al-Bukhari",
      state: "Kedah",
      address: "Jalan Masjid, Alor Setar",
      phone: "04-7333000",
      email: "info@albukhary.org.my",
      url: "https://www.albukhary.org.my",
      latitude: 6.1190,
      longitude: 100.3678,
      photourl: "",
    },
    {
      name: "Masjid Tengku Ampuan Afzan",
      state: "Pahang",
      address: "Kuantan, Pahang",
      phone: "09-5142233",
      email: "info@mtaapahang.my",
      url: "",
      latitude: 3.8071,
      longitude: 103.3263,
      photourl: "",
    },
    {
      name: "Masjid Al-Falah",
      state: "Terengganu",
      address: "Kuala Terengganu, Terengganu",
      phone: "09-6178899",
      email: "alfalah@masjid.my",
      url: "",
      latitude: 5.3320,
      longitude: 103.1420,
      photourl: "",
    },
  ];

  for (const data of mosqueData) {
    const existing = await mosqueRepo.findOneBy({ name: data.name });
    if (!existing) {
      const newMosque = mosqueRepo.create(data);
      await mosqueRepo.save(newMosque);
    } else {
      // This will update existing mosques with the new phone/email/url
      Object.assign(existing, data);
      await mosqueRepo.save(existing);
    }
  }

  console.log(`✔ Successfully seeded ${mosqueData.length} dummy Mosques.`);
}