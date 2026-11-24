export type Research = {
  id: string;
  title: string;
  abstract: string;
  keywords: string[];
  author: string;
  authors?: string[]; // Daftar penulis lengkap untuk sitasi
  institution: string;
  publishedAt: string; // tampilan, mis. "12 Sep 2026"
  year: number;
  studyProgram: string;
  method: string;
  volume: string; // volume jurnal, mis. "12"
  issue: string; // nomor issue dalam volume, mis. "2"
  pageRange: string; // halaman artikel di dalam issue, mis. "101–112"
  language: string;
  journal: string;
  journalIndex: string; // mis. "Sinta 4"
  views: number;
  citations: number; // sitasi (nanti dari Google Scholar)
  authorCitations: number;
  link: string; // tautan ke halaman jurnal, bukan PDF
  verified: boolean; // true = Terverifikasi LPPM, false = On Review
};

export type Filters = {
  studyProgram?: string;
  year?: string;
  publicationType?: string;
  topics: string[]; // boleh lebih dari satu (cocok jika memuat salah satu)
  methods: string[]; // boleh lebih dari satu
};
