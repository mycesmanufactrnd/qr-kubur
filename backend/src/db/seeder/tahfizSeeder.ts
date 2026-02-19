import "reflect-metadata";
import { AppDataSource } from "../../datasource.ts";
import { TahfizCenter, ServiceOffered } from "../entities.ts";

export async function runTahfizSeeder() {
  console.log("🌱 Seeding 10 Tahfiz Centers...");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const tahfizRepo = AppDataSource.getRepository(TahfizCenter);
  const serviceRepo = AppDataSource.getRepository(ServiceOffered);

  const tahfizData = [
    {
      name: "Maahad Tahfiz Al-Quran Darul Uloom",
      description: "Pusat pengajian tahfiz integrasi dengan penekanan pada hafazan dan akademik.",
      services: [
        { service: "tahlil_ringkas", price: 50.0 },
        { service: "doa_arwah", price: 30.0 },
        { service: "yasin", price: 40.0 },
      ],
      state: "Selangor",
      address: "Seksyen 7, Shah Alam, Selangor",
      phone: "03-55112233",
      email: "admin@darululoom.my",
      url: "https://darululoom.my",
      latitude: 3.0696,
      longitude: 101.4897,
    },
    {
      name: "Madrasah Tahfiz Nurul Hidayah",
      description: "Pusat pengajian tahfiz tradisional di kawasan kampung yang tenang.",
      services: [
        { service: "tahlil_ringkas", price: 40.0 },
        { service: "tahlil_panjang", price: 1500.0 },
        { service: "custom", price: 10.0 },
      ],
      state: "Negeri Sembilan",
      address: "Kampung Paroi, Seremban, Negeri Sembilan",
      phone: "06-6778899",
      email: "info@nurulhidayah.com",
      url: "https://nurulhidayah.com",
      latitude: 2.7161,
      longitude: 101.9912,
    },
    {
      name: "Tahfiz Al-Ikhlas Melaka",
      description: "Pusat tahfiz untuk anak yatim dan asnaf.",
      services: [
        { service: "tahlil_ringkas", price: 60.0 },
        { service: "yasin", price: 25.0 },
      ],
      state: "Melaka",
      address: "Bukit Katil, Melaka",
      phone: "011-12345678",
      email: "tahfiz.ikhlas@melaka.gov.my",
      url: "https://tahfizmelaka.com",
      latitude: 2.2241,
      longitude: 102.2987,
    },
    {
      name: "Akademi Tahfiz Al-Hikmah Johor",
      description: "Menumpukan kepada pembentukan sahsiah dan hafazan 30 juzuk.",
      services: [
        { service: "tahlil_ringkas", price: 45.0 },
        { service: "tahlil_panjang", price: 800.0 },
        { service: "custom", price: 20.0 },
      ],
      state: "Johor",
      address: "Taman Universiti, Skudai, Johor",
      phone: "07-5211223",
      email: "alhikmah.johor@gmail.com",
      url: "https://alhikmahjohor.org",
      latitude: 1.5458,
      longitude: 103.6366,
    },
    {
      name: "Pusat Tahfiz Darul Ridzuan",
      description: "Pusat pengajian Islam di bawah naungan komuniti setempat.",
      services: [
        { service: "tahlil_ringkas", price: 55.0 },
        { service: "custom", price: 300.0 },
        { service: "doa_arwah", price: 5.0 },
      ],
      state: "Perak",
      address: "Ipoh, Perak Darul Ridzuan",
      phone: "05-2415566",
      email: "darulridzuan@perak.gov.my",
      url: "https://tahfizridzuan.my",
      latitude: 4.5975,
      longitude: 101.0901,
    },
    {
      name: "Maahad Tahfiz Sains Pulau Pinang",
      description: "Menggabungkan sukatan tahfiz dengan subjek sains tulen.",
      services: [
        { service: "tahlil_ringkas", price: 50.0 },
        { service: "custom", price: 100.0 },
        { service: "yasin", price: 15.0 },
      ],
      state: "Pulau Pinang",
      address: "Kepala Batas, Pulau Pinang",
      phone: "04-5751122",
      email: "admin@mtspp.edu.my",
      url: "https://mtspp.edu.my",
      latitude: 5.5146,
      longitude: 100.4287,
    },
    {
      name: "Madrasah Tahfiz Al-Islah Kedah",
      description: "Pusat pengajian pondok moden yang menekankan kitab turath.",
      services: [
        { service: "tahlil_ringkas", price: 35.0 },
        { service: "doa_arwah", price: 10.0 },
        { service: "custom", price: 50.0 },
      ],
      state: "Kedah",
      address: "Yan, Kedah Darul Aman",
      phone: "04-4658899",
      email: "info@madrasah-alislah.com",
      url: "https://alislahkedah.com",
      latitude: 5.8014,
      longitude: 100.3742,
    },
    {
      name: "Tahfiz Darul Iman Terengganu",
      description: "Melatih huffaz muda dengan kemahiran memanah dan berkuda.",
      services: [
        { service: "tahlil_ringkas", price: 40.0 },
        { service: "yasin", price: 30.0 },
        { service: "custom", price: 650.0 },
      ],
      state: "Terengganu",
      address: "Kuala Terengganu, Terengganu",
      phone: "09-6223344",
      email: "daruliman@tahfiz.my",
      url: "https://tahfizterengganu.gov.my",
      latitude: 5.3302,
      longitude: 103.1408,
    },
    {
      name: "Pusat Tahfiz Raudhatul Jannah Kelantan",
      description: "Institusi pengajian Al-Quran tertua di kawasan pedalaman.",
      services: [
        { service: "tahlil_ringkas", price: 30.0 },
        { service: "doa_arwah", price: 20.0 },
        { service: "custom", price: 500.0 },
      ],
      state: "Kelantan",
      address: "Machang, Kelantan",
      phone: "09-9751234",
      email: "raudhatul@kelantan.edu.my",
      url: "https://raudhatuljannah.com",
      latitude: 5.7654,
      longitude: 102.2145,
    },
    {
      name: "Tahfiz Al-Hidayah Sabah",
      description: "Menjangkau komuniti luar bandar untuk pendidikan Islam.",
      services: [
        { service: "tahlil_ringkas", price: 50.0 },
        { service: "yasin", price: 150.0 },
        { service: "custom", price: 10.0 },
      ],
      state: "Sabah",
      address: "Kota Kinabalu, Sabah",
      phone: "088-432112",
      email: "alhidayah.sabah@gmail.com",
      url: "https://tahfizsabah.org",
      latitude: 5.9788,
      longitude: 116.0753,
    }
  ];

  for (const data of tahfizData) {
    const existing = await tahfizRepo.findOneBy({ name: data.name });
    if (existing) continue;

    const { services, ...tahfizCenterData } = data;
    const savedTahfiz = await tahfizRepo.save(tahfizRepo.create(tahfizCenterData));

    if (services.length > 0) {
      const serviceEntities = services.map((service) =>
        serviceRepo.create({
          ...service,
          tahfizcenter: savedTahfiz,
        })
      );

      await serviceRepo.save(serviceEntities);
    }
  }

  console.log(`✔ Successfully seeded ${tahfizData.length} dummy Tahfiz Centers.`);
}

