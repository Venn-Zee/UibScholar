/**
 * Data dummy jurnal untuk fitur Compare.
 *
 * CATATAN INTEGRASI SUPABASE:
 * Saat backend siap, ganti export `journals` dengan query ke tabel `journals`:
 *
 *   const { data } = await supabase.from("journals").select("*");
 *   export const journals: Journal[] = data ?? [];
 *
 * Skema tabel Supabase yang direkomendasikan:
 *   CREATE TABLE journals (
 *     id          text PRIMARY KEY,
 *     name        text NOT NULL,
 *     issn        text,
 *     e_issn      text,
 *     index       text NOT NULL,          -- mis. "Sinta 2", "Scopus"
 *     publisher   text,
 *     scope       text,                   -- bidang ilmu utama
 *     frequency   text,                   -- mis. "4× per tahun"
 *     access_type text,                   -- "Open Access" | "Berbayar" | "Campuran"
 *     language    text,
 *     country     text,
 *     website     text,
 *     topics      text[],                 -- array topik/keyword
 *     description text,
 *     created_at  timestamptz DEFAULT now()
 *   );
 */

export type Journal = {
  id: string;
  name: string;
  issn?: string;
  eIssn?: string;
  index: string;         // "Sinta 1" | "Sinta 2" | ... | "Scopus" | "WoS"
  publisher: string;
  scope: string;         // Bidang ilmu utama
  frequency: string;     // Frekuensi terbit
  accessType: string;    // "Open Access" | "Berbayar" | "Campuran"
  language: string;
  country: string;
  website?: string;
  topics: string[];      // Topik / kata kunci yang dicakup
  description: string;
};

export const journals: Journal[] = [
  {
    id: "j1",
    name: "Journal of Information System and Technology (JOINT)",
    issn: "2548-4834",
    eIssn: "2548-9534",
    index: "Sinta 4",
    publisher: "Universitas Internasional Batam",
    scope: "Sistem Informasi & Teknologi",
    frequency: "2× per tahun",
    accessType: "Open Access",
    language: "Indonesia / Inggris",
    country: "Indonesia",
    website: "https://journal.uib.ac.id/index.php/joint",
    topics: ["Sistem Informasi", "Machine Learning", "Big Data", "IoT", "E-Commerce", "ERP"],
    description:
      "Jurnal ilmiah yang menerbitkan hasil penelitian di bidang sistem informasi, rekayasa perangkat lunak, dan teknologi informasi terapan.",
  },
  {
    id: "j2",
    name: "Jurnal Teknologi Informasi",
    issn: "1907-2430",
    eIssn: "2685-4015",
    index: "Sinta 3",
    publisher: "LPPM Universitas Dian Nuswantoro",
    scope: "Teknologi Informasi & Komputer",
    frequency: "3× per tahun",
    accessType: "Open Access",
    language: "Indonesia",
    country: "Indonesia",
    website: "https://publikasi.dinus.ac.id/index.php/jt",
    topics: ["AI", "Machine Learning", "Jaringan Komputer", "Keamanan Siber", "UMKM Digital", "Transformasi Digital"],
    description:
      "Menerbitkan penelitian orisinal tentang pengembangan, penerapan, dan evaluasi teknologi informasi dan sistem komputer.",
  },
  {
    id: "j3",
    name: "Jurnal Interaksi Manusia dan Komputer",
    issn: "2655-5891",
    eIssn: "2655-990X",
    index: "Sinta 4",
    publisher: "APTIKOM",
    scope: "Human-Computer Interaction & UX",
    frequency: "2× per tahun",
    accessType: "Open Access",
    language: "Indonesia",
    country: "Indonesia",
    website: "https://jurnal.aptikom.or.id/imk",
    topics: ["UX", "UI Design", "Usability", "E-Commerce", "Mobile App", "Aksesibilitas"],
    description:
      "Fokus pada penelitian interaksi antara manusia dan sistem komputer, termasuk desain antarmuka, pengalaman pengguna, dan aksesibilitas.",
  },
  {
    id: "j4",
    name: "Jurnal Sistem Informasi",
    issn: "1979-0767",
    eIssn: "2461-0690",
    index: "Sinta 5",
    publisher: "Universitas Islam Negeri Syarif Hidayatullah",
    scope: "Sistem Informasi Manajemen",
    frequency: "2× per tahun",
    accessType: "Open Access",
    language: "Indonesia",
    country: "Indonesia",
    website: "https://journal.uinjkt.ac.id/index.php/jsi",
    topics: ["Sistem Informasi Akademik", "ERP", "SAP", "Web", "Basis Data", "Keamanan Informasi"],
    description:
      "Menerbitkan hasil penelitian di bidang pengembangan dan implementasi sistem informasi berbasis komputer di lingkungan organisasi.",
  },
  {
    id: "j5",
    name: "Jurnal Ilmu Komputer",
    issn: "1979-116X",
    eIssn: "2614-8897",
    index: "Sinta 4",
    publisher: "Universitas Udayana",
    scope: "Ilmu Komputer & Informatika",
    frequency: "2× per tahun",
    accessType: "Open Access",
    language: "Indonesia / Inggris",
    country: "Indonesia",
    website: "https://ojs.unud.ac.id/index.php/jik",
    topics: ["Algoritma", "Naive Bayes", "NLP", "Pengenalan Pola", "Data Mining", "Klasifikasi"],
    description:
      "Jurnal bidang ilmu komputer yang mencakup algoritma, kecerdasan buatan, pengenalan pola, dan pengolahan bahasa alami.",
  },
  {
    id: "j6",
    name: "Jurnal Manajemen Bisnis",
    issn: "1979-1844",
    eIssn: "2615-7527",
    index: "Sinta 5",
    publisher: "Universitas Muhammadiyah Malang",
    scope: "Manajemen & Bisnis",
    frequency: "2× per tahun",
    accessType: "Open Access",
    language: "Indonesia",
    country: "Indonesia",
    website: "https://ejournal.umm.ac.id/index.php/jmb",
    topics: ["Digital Marketing", "UMKM", "Pemasaran", "Strategi Bisnis", "Kewirausahaan", "Batam"],
    description:
      "Menerbitkan penelitian manajemen bisnis, pemasaran, kewirausahaan, dan ekonomi manajerial dengan konteks nasional.",
  },
  {
    id: "j7",
    name: "Jurnal Akuntansi dan Keuangan",
    issn: "1411-0288",
    eIssn: "2338-8137",
    index: "Sinta 3",
    publisher: "Universitas Kristen Petra",
    scope: "Akuntansi & Keuangan",
    frequency: "4× per tahun",
    accessType: "Open Access",
    language: "Indonesia / Inggris",
    country: "Indonesia",
    website: "https://jurnalakuntansi.petra.ac.id",
    topics: ["Akuntansi", "SAK EMKM", "Laporan Keuangan", "Audit", "Perpajakan", "IFRS"],
    description:
      "Jurnal terakreditasi yang memuat hasil penelitian empiris di bidang akuntansi keuangan, manajemen, perpajakan, dan auditing.",
  },
  {
    id: "j8",
    name: "Jurnal Hukum dan Pembangunan",
    issn: "0125-9687",
    eIssn: "2503-1465",
    index: "Sinta 2",
    publisher: "Universitas Indonesia",
    scope: "Hukum & Pembangunan",
    frequency: "4× per tahun",
    accessType: "Open Access",
    language: "Indonesia / Inggris",
    country: "Indonesia",
    website: "https://jhp.ui.ac.id",
    topics: ["Hukum Perdata", "Perlindungan Konsumen", "E-Commerce", "Hukum Bisnis", "Kebijakan Publik", "Cyberlaw"],
    description:
      "Salah satu jurnal hukum tertua di Indonesia, memuat penelitian hukum normatif maupun empiris dengan lingkup nasional dan internasional.",
  },
  // --- Data dummy jurnal terindeks Scopus: indexing memakai kuartil Q1–Q4 ---
  {
    id: "j9",
    name: "Journal of Advanced Computing and Intelligent Systems",
    issn: "2210-0001",
    eIssn: "2210-0002",
    index: "Q1",
    publisher: "Global Academic Press",
    scope: "Computing & Artificial Intelligence",
    frequency: "12× per tahun",
    accessType: "Campuran",
    language: "Inggris",
    country: "Belanda",
    website: "https://example.com/jacis",
    topics: ["Machine Learning", "Federated Learning", "Deep Learning", "Privasi", "IoT", "UMKM"],
    description: "Jurnal internasional bereputasi tinggi untuk komputasi cerdas, pembelajaran mesin, dan sistem terdistribusi.",
  },
  {
    id: "j10",
    name: "International Journal of Business Analytics and Strategy",
    issn: "2340-1100",
    eIssn: "2340-1101",
    index: "Q2",
    publisher: "Global Academic Press",
    scope: "Business Analytics & Strategy",
    frequency: "6× per tahun",
    accessType: "Campuran",
    language: "Inggris",
    country: "Inggris",
    website: "https://example.com/ijbas",
    topics: ["Digital Marketing", "E-Commerce", "Perilaku Konsumen", "Batam", "Analitik Bisnis", "UMKM"],
    description: "Penelitian analitik bisnis, pemasaran digital, dan strategi perusahaan di pasar berkembang.",
  },
  {
    id: "j11",
    name: "Southeast Asian Journal of Engineering Management",
    issn: "2672-4400",
    eIssn: "2672-4401",
    index: "Q3",
    publisher: "Nusantara Scientific Publishing",
    scope: "Teknik & Manajemen Rekayasa",
    frequency: "4× per tahun",
    accessType: "Berbayar",
    language: "Inggris",
    country: "Singapura",
    website: "https://example.com/seajem",
    topics: ["IoT", "Struktur Beton", "Monitoring", "Sensor", "Manajemen Konstruksi", "Keberlanjutan"],
    description: "Penelitian rekayasa dan manajemen proyek konstruksi dengan fokus kawasan Asia Tenggara.",
  },
  {
    id: "j12",
    name: "Asian Journal of Law and Digital Society",
    issn: "2811-7700",
    eIssn: "2811-7701",
    index: "Q4",
    publisher: "Nusantara Scientific Publishing",
    scope: "Hukum & Masyarakat Digital",
    frequency: "2× per tahun",
    accessType: "Open Access",
    language: "Inggris",
    country: "Malaysia",
    website: "https://example.com/ajlds",
    topics: ["Hukum", "Perlindungan Konsumen", "ASEAN", "Cyberlaw", "Kebijakan Publik", "Privasi"],
    description: "Kajian hukum perbandingan dan regulasi transaksi digital di kawasan ASEAN.",
  },
];

/** Ambil data jurnal berdasarkan nama jurnal (dari data penelitian) */
export function getJournalByName(journalName: string): Journal | undefined {
  return journals.find((j) => j.name === journalName);
}

/** Ambil semua jurnal unik yang muncul di data penelitian */
export function getAvailableJournals(): Journal[] {
  return journals;
}
