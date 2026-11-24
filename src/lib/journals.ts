import { Journal, journals as localJournals } from "@/src/data/journals";
import { supabase } from "@/src/lib/supabase";

type JournalRow = {
  id: string;
  name: string;
  issn: string | null;
  e_issn: string | null;
  index: string;
  publisher: string | null;
  scope: string | null;
  frequency: string | null;
  access_type: string | null;
  language: string | null;
  country: string | null;
  website: string | null;
  topics: string[] | null;
  description: string | null;
};

function fromRow(r: JournalRow): Journal {
  return {
    id: r.id,
    name: r.name,
    issn: r.issn ?? undefined,
    eIssn: r.e_issn ?? undefined,
    index: r.index,
    publisher: r.publisher ?? "-",
    scope: r.scope ?? "-",
    frequency: r.frequency ?? "-",
    accessType: r.access_type ?? "-",
    language: r.language ?? "-",
    country: r.country ?? "-",
    website: r.website ?? undefined,
    topics: r.topics ?? [],
    description: r.description ?? "",
  };
}

/**
 * Ambil daftar jurnal. Urutan: Supabase (tabel `journals`) -> fallback data dummy lokal.
 * Fallback dipakai jika tabel belum dibuat, kosong, atau request gagal.
 */
export async function fetchJournals(): Promise<{ data: Journal[]; source: "supabase" | "dummy" }> {
  try {
    const { data, error } = await supabase.from("journals").select("*").order("name");
    if (!error && data && data.length > 0) {
      return { data: (data as JournalRow[]).map(fromRow), source: "supabase" };
    }
  } catch {
    // abaikan, pakai data dummy
  }
  return { data: localJournals, source: "dummy" };
}
