import { abbreviateJournalIndex, formatCitationAuthor, indexLabel } from "@/src/lib/format";
import { Research } from "@/src/types/research";
import { Award, Bookmark, BookOpen, Building2, User } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

type Props = {
  item: Research;
  saved?: boolean;
  onToggleSave?: () => void;
  onPress?: () => void;
};

/** Warna latar kotak index berdasarkan tier */
function indexBgColor(journalIndex: string): string {
  const s = journalIndex.toLowerCase();
  if (/sinta\s*1|q1|scopus|wos/i.test(s)) return "#0F2D57";
  if (/sinta\s*2|q2/i.test(s)) return "#1F3F6E";
  if (/sinta\s*3|q3/i.test(s)) return "#2B5494";
  if (/sinta\s*4|q4/i.test(s)) return "#3B6CB0";
  return "#4A80C4";
}

export function ResearchCard({ item, saved = false, onToggleSave, onPress }: Props) {
  const authorCitation = formatCitationAuthor(item.author, item.authors);
  const abbrev = item.journalIndex ? abbreviateJournalIndex(item.journalIndex) : "–";
  const bgColor = item.journalIndex ? indexBgColor(item.journalIndex) : "#4A80C4";

  return (
    <Pressable
      onPress={onPress}
      className="grow flex-row gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-sm active:opacity-90"
    >
      {/* Kotak Index Jurnal */}
      <View
        style={{ backgroundColor: bgColor, width: 64, height: 96, borderRadius: 12 }}
        className="items-center justify-center"
      >
        <Text style={{ color: "white", fontSize: 22, fontFamily: "Poppins_700Bold", lineHeight: 28 }}>
          {abbrev}
        </Text>
      </View>

      {/* Konten Informasi Penelitian */}
      <View className="flex-1 justify-between">
        {/* Judul & Tombol Simpan */}
        <View className="flex-row items-start justify-between gap-2">
          <Text
            numberOfLines={2}
            className="flex-1 font-poppins-bold text-sm leading-5 text-primary"
          >
            {item.title}
          </Text>
          {onToggleSave && (
            <Pressable onPress={onToggleSave} hitSlop={10} className="p-0.5">
              <Bookmark
                size={19}
                color={saved ? "#F5B301" : "#9AA3B2"}
                fill={saved ? "#F5B301" : "transparent"}
              />
            </Pressable>
          )}
        </View>

        {/* Penulis (Gaya Sitasi Ilmiah) */}
        <View className="mt-1.5 flex-row items-center gap-1.5">
          <User size={12} color="#7A8494" />
          <Text numberOfLines={1} className="flex-1 font-poppins text-[11px] text-muted">
            {authorCitation}
          </Text>
        </View>

        {/* Institusi */}
        <View className="mt-0.5 flex-row items-center gap-1.5">
          <Building2 size={12} color="#7A8494" />
          <Text numberOfLines={1} className="flex-1 font-poppins text-[11px] text-muted">
            {item.institution}
          </Text>
        </View>

        {/* Indexing & Nama Jurnal Publikasi */}
        {item.journalIndex ? (
          <View className="mt-0.5 flex-row items-center gap-1.5">
            <Award size={12} color="#7A8494" />
            <Text numberOfLines={1} className="flex-1 font-poppins-semibold text-[11px] text-muted">
              {indexLabel(item.journalIndex)}
            </Text>
          </View>
        ) : null}
        <View className="mt-0.5 flex-row items-center gap-1.5">
          <BookOpen size={12} color="#7A8494" />
          <Text numberOfLines={1} className="flex-1 font-poppins text-[11px] text-muted">
            {item.journal}
          </Text>
        </View>

        {/* Tanggal Publikasi */}
        <View className="mt-2 border-t border-line/40 pt-1.5">
          <Text className="font-poppins text-[10px] text-muted">{item.publishedAt}</Text>
        </View>
      </View>
    </Pressable>
  );
}
