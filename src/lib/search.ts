import { researches } from "@/src/data/research";
import { Filters, Research } from "@/src/types/research";

export const emptyFilters: Filters = { topics: [], methods: [] };

export function countActiveFilters(f: Filters): number {
  return (
    [f.studyProgram, f.year, f.publicationType].filter(Boolean).length + f.topics.length + f.methods.length
  );
}

// Semua pencarian lewat sini, jadi saat backend siap cukup ganti isi fungsi ini dengan panggilan API.
export function searchResearches(query: string, filters: Filters): Research[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const topics = filters.topics.map((t) => t.toLowerCase());
  const methods = filters.methods.map((m) => m.toLowerCase());

  return researches.filter((r) => {
    if (filters.studyProgram && r.studyProgram !== filters.studyProgram) return false;
    if (filters.year && String(r.year) !== filters.year) return false;
    if (filters.publicationType && r.journalIndex !== filters.publicationType) return false;
    if (topics.length && !r.keywords.some((k) => topics.includes(k.toLowerCase()))) return false;
    if (methods.length && !methods.some((m) => r.method.toLowerCase().includes(m))) return false;

    if (words.length === 0) return true;
    const haystack = [
      r.title,
      r.author,
      ...(r.authors || []),
      r.studyProgram,
      r.journal,
      r.journalIndex,
      ...r.keywords,
    ]
      .join(" ")
      .toLowerCase();
    return words.every((w) => haystack.includes(w));
  });
}

export function uniqueYears(): string[] {
  return [...new Set(researches.map((r) => String(r.year)))].sort((a, b) => Number(b) - Number(a));
}

export function uniqueTopics(): string[] {
  return [...new Set(researches.flatMap((r) => r.keywords))].sort((a, b) => a.localeCompare(b));
}

export type Researcher = { name: string; institution: string; count: number; programs: string[] };

export function getResearchers(): Researcher[] {
  const map = new Map<string, Researcher>();
  for (const r of researches) {
    const cur = map.get(r.author);
    if (cur) {
      cur.count += 1;
      if (!cur.programs.includes(r.studyProgram)) cur.programs.push(r.studyProgram);
    } else {
      map.set(r.author, { name: r.author, institution: r.institution, count: 1, programs: [r.studyProgram] });
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function countByProgram(program: string): number {
  return researches.filter((r) => r.studyProgram === program).length;
}
