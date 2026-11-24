/**
 * Hapus gelar akademik dari nama untuk ditampilkan.
 * "Herman, S.Kom., M.Kom." → "Herman" · "Dr. Budi Santoso, M.T." → "Budi Santoso"
 * Data asli tidak diubah (gelar masih dipakai internal untuk membedakan dosen/mahasiswa).
 */
export function stripTitles(name: string): string {
  if (!name) return name;
  return name
    .split(",")[0]
    .replace(/^((Prof|Dr|Ir|Drs|Dra)\.?\s+)+/i, "")
    .trim();
}

/** Label lengkap indexing. Scopus memakai kuartil: "Q1" → "Scopus Q1". */
export function indexLabel(journalIndex: string): string {
  return /^Q[1-4]$/i.test(journalIndex.trim()) ? `Scopus ${journalIndex.trim().toUpperCase()}` : journalIndex;
}

/** Kelompok indexing: "Scopus" (Q1–Q4) atau "Sinta" atau "Lainnya". */
export function indexGroup(journalIndex: string): "Scopus" | "Sinta" | "Lainnya" {
  if (/^Q[1-4]$/i.test(journalIndex.trim())) return "Scopus";
  if (/^Sinta/i.test(journalIndex.trim())) return "Sinta";
  return "Lainnya";
}

/**
 * Singkat nama indeks jurnal menjadi kode ringkas untuk ditampilkan di thumbnail.
 * Contoh: "Sinta 4" → "S4", "Q1" → "Q1", "Scopus" → "SC"
 */
export function abbreviateJournalIndex(journalIndex: string): string {
  const s = journalIndex.trim();
  const sintaMatch = s.match(/Sinta\s*(\d+)/i);
  if (sintaMatch) return `S${sintaMatch[1]}`;
  const qMatch = s.match(/^Q(\d+)$/i);
  if (qMatch) return `Q${qMatch[1]}`;
  if (/scopus/i.test(s)) return "SC";
  if (/wos|web of science/i.test(s)) return "WS";
  return s.slice(0, 2).toUpperCase();
}

/** Warna kotak indexing berdasarkan tier (Sinta 1 / Q1 paling gelap). */
export function indexColor(journalIndex: string): string {
  const s = journalIndex.trim().toLowerCase();
  if (/^(sinta\s*1|q1)$/.test(s)) return "#0F2D57";
  if (/^(sinta\s*2|q2)$/.test(s)) return "#1F3F6E";
  if (/^(sinta\s*3|q3)$/.test(s)) return "#2B5494";
  if (/^(sinta\s*4|q4)$/.test(s)) return "#3B6CB0";
  return "#4A80C4";
}

/** Daftar nama penulis (tanpa gelar). */
function cleanAuthors(author: string, authors?: string[]): string[] {
  const list = authors && authors.length > 0 ? authors : author ? [author] : [];
  return list.map(stripTitles).filter(Boolean);
}

/**
 * Format nama penulis dalam gaya sitasi (citation style), tanpa gelar.
 * - 1 penulis : "Herman"
 * - 2 penulis : "Herman & Jessica S"
 * - 3+ penulis: "Herman, et al."
 * Jika hanya ada satu nama tanpa daftar penulis, ditambah "et al." karena karya ilmiah umumnya beregu.
 */
export function formatCitationAuthor(author: string, authors?: string[]): string {
  if (!authors?.length && /\b(et al|dkk)\b/i.test(author ?? "")) return author;

  const names = cleanAuthors(author, authors);
  if (names.length === 0) return "-";
  if (names.length === 1) return authors?.length ? names[0] : `${names[0]}, et al.`;
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names[0]}, et al.`;
}

/**
 * Daftar penulis lengkap tanpa gelar, tanda "&" sebelum nama terakhir.
 * 1 penulis: "A" · 2 penulis: "A & B" · 3+ penulis: "A, B, & C"
 */
export function formatAuthorList(author: string, authors?: string[]): string {
  const names = cleanAuthors(author, authors);
  if (names.length === 0) return "-";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, & ${names[names.length - 1]}`;
}
