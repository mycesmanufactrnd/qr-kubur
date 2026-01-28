
import "reflect-metadata";
import { AppDataSource } from "../../datasource.ts";
import { TahfizCenter } from "../entities.ts"; 

export async function runTahfizSeeder() {
  console.log("🌱 Seeding 10 Tahfiz Centers...");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const tahfizRepo = AppDataSource.getRepository(TahfizCenter);

  const tahfizData = [
    {
      name: "Maahad Tahfiz Al-Quran Darul Uloom",
      description: "Pusat pengajian tahfiz integrasi dengan penekanan pada hafazan dan akademik.",
      serviceoffered: ["Tahlil Arwah", "Doa Selamat", "Khatam Al-Quran"],
      serviceprice: { tahlil: 50.00, doa_selamat: 30.00, khatam: 200.00 },
      state: "Selangor",
      address: "Seksyen 7, Shah Alam, Selangor",
      phone: "03-55112233",
      email: "admin@darululoom.my",
      url: "https://darululoom.my",
      latitude: 3.0696,
      longitude: 101.4897,
      canbedonated: true,
    },
    {
      name: "Madrasah Tahfiz Nurul Hidayah",
      description: "Pusat pengajian tahfiz tradisional di kawasan kampung yang tenang.",
      serviceoffered: ["Tahlil Arwah", "Badal Haji", "Sumbangan Infaq"],
      serviceprice: { tahlil: 40.00, badal_haji: 1500.00, infaq: 10.00 },
      state: "Negeri Sembilan",
      address: "Kampung Paroi, Seremban, Negeri Sembilan",
      phone: "06-6778899",
      email: "info@nurulhidayah.com",
      url: "https://nurulhidayah.com",
      latitude: 2.7161,
      longitude: 101.9912,
      canbedonated: true,
    },
    {
      name: "Tahfiz Al-Ikhlas Melaka",
      description: "Pusat tahfiz untuk anak yatim dan asnaf.",
      serviceoffered: ["Tahlil Arwah", "Wakaf Al-Quran"],
      serviceprice: { tahlil: 60.00, wakaf: 25.00 },
      state: "Melaka",
      address: "Bukit Katil, Melaka",
      phone: "011-12345678",
      email: "tahfiz.ikhlas@melaka.gov.my",
      url: "https://tahfizmelaka.com",
      latitude: 2.2241,
      longitude: 102.2987,
      canbedonated: true,
    },
    {
      name: "Akademi Tahfiz Al-Hikmah Johor",
      description: "Menumpukan kepada pembentukan sahsiah dan hafazan 30 juzuk.",
      serviceoffered: ["Tahlil Arwah", "Sumbangan Ihsan", "Qurban"],
      serviceprice: { tahlil: 45.00, sumbangan: 20.00, qurban: 800.00 },
      state: "Johor",
      address: "Taman Universiti, Skudai, Johor",
      phone: "07-5211223",
      email: "alhikmah.johor@gmail.com",
      url: "https://alhikmahjohor.org",
      latitude: 1.5458,
      longitude: 103.6366,
      canbedonated: true,
    },
    {
      name: "Pusat Tahfiz Darul Ridzuan",
      description: "Pusat pengajian Islam di bawah naungan komuniti setempat.",
      serviceoffered: ["Tahlil Arwah", "Badal Umrah", "Sadaqah Jariah"],
      serviceprice: { tahlil: 55.00, badal_umrah: 300.00, sadaqah: 5.00 },
      state: "Perak",
      address: "Ipoh, Perak Darul Ridzuan",
      phone: "05-2415566",
      email: "darulridzuan@perak.gov.my",
      url: "https://tahfizridzuan.my",
      latitude: 4.5975,
      longitude: 101.0901,
      canbedonated: true,
    },
    {
      name: "Maahad Tahfiz Sains Pulau Pinang",
      description: "Menggabungkan sukatan tahfiz dengan subjek sains tulen.",
      serviceoffered: ["Tahlil Arwah", "Wakaf Bangunan", "Ifthar Ramadhan"],
      serviceprice: { tahlil: 50.00, wakaf: 100.00, ifthar: 15.00 },
      state: "Pulau Pinang",
      address: "Kepala Batas, Pulau Pinang",
      phone: "04-5751122",
      email: "admin@mtspp.edu.my",
      url: "https://mtspp.edu.my",
      latitude: 5.5146,
      longitude: 100.4287,
      canbedonated: true,
    },
    {
      name: "Madrasah Tahfiz Al-Islah Kedah",
      description: "Pusat pengajian pondok moden yang menekankan kitab turath.",
      serviceoffered: ["Tahlil Arwah", "Zakat Fidyah", "Sumbangan Anak Yatim"],
      serviceprice: { tahlil: 35.00, fidyah: 10.00, sumbangan: 50.00 },
      state: "Kedah",
      address: "Yan, Kedah Darul Aman",
      phone: "04-4658899",
      email: "info@madrasah-alislah.com",
      url: "https://alislahkedah.com",
      latitude: 5.8014,
      longitude: 100.3742,
      canbedonated: true,
    },
    {
      name: "Tahfiz Darul Iman Terengganu",
      description: "Melatih huffaz muda dengan kemahiran memanah dan berkuda.",
      serviceoffered: ["Tahlil Arwah", "Wakaf Al-Quran", "Aqiqah"],
      serviceprice: { tahlil: 40.00, wakaf: 30.00, aqiqah: 650.00 },
      state: "Terengganu",
      address: "Kuala Terengganu, Terengganu",
      phone: "09-6223344",
      email: "daruliman@tahfiz.my",
      url: "https://tahfizterengganu.gov.my",
      latitude: 5.3302,
      longitude: 103.1408,
      canbedonated: true,
    },
    {
      name: "Pusat Tahfiz Raudhatul Jannah Kelantan",
      description: "Institusi pengajian Al-Quran tertua di kawasan pedalaman.",
      serviceoffered: ["Tahlil Arwah", "Ihsan Ramadhan", "Wakaf Perigi"],
      serviceprice: { tahlil: 30.00, ihsan: 20.00, wakaf: 500.00 },
      state: "Kelantan",
      address: "Machang, Kelantan",
      phone: "09-9751234",
      email: "raudhatul@kelantan.edu.my",
      url: "https://raudhatuljannah.com",
      latitude: 5.7654,
      longitude: 102.2145,
      canbedonated: true,
    },
    {
      name: "Tahfiz Al-Hidayah Sabah",
      description: "Menjangkau komuniti luar bandar untuk pendidikan Islam.",
      serviceoffered: ["Tahlil Arwah", "Sumbangan Dakwah", "Khatam Quran"],
      serviceprice: { tahlil: 50.00, dakwah: 10.00, khatam: 150.00 },
      state: "Sabah",
      address: "Kota Kinabalu, Sabah",
      phone: "088-432112",
      email: "alhidayah.sabah@gmail.com",
      url: "https://tahfizsabah.org",
      latitude: 5.9788,
      longitude: 116.0753,
      canbedonated: true,
    }
  ];

  for (const data of tahfizData) {
    const existing = await tahfizRepo.findOneBy({ name: data.name });
    if (!existing) {
      const newTahfiz = tahfizRepo.create(data);
      await tahfizRepo.save(newTahfiz);
    }
  }

  console.log(`✔ Successfully seeded ${tahfizData.length} dummy Tahfiz Centers.`);
}