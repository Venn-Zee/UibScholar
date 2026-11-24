import { Journal } from "@/src/data/journals";
import { abbreviateJournalIndex, indexColor, indexLabel } from "@/src/lib/format";
import { Award, BookOpen, Building2 } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

type Props = {
  journal: Journal;
  publicationCount?: number;
  onPress?: () => void;
};

/** Kartu jurnal publikasi: gaya sama dengan ResearchCard. */
export function JournalCard({ journal, publicationCount = 0, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="grow flex-row gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-sm active:opacity-90"
    >
      {/* Kotak Index Jurnal */}
      <View
        style={{ backgroundColor: indexColor(journal.index), width: 64, height: 96, borderRadius: 12 }}
        className="items-center justify-center"
      >
        <Text style={{ color: "white", fontSize: 22, fontFamily: "Poppins_700Bold", lineHeight: 28 }}>
          {abbreviateJournalIndex(journal.index)}
        </Text>
      </View>

      <View className="flex-1 justify-between">
        <Text numberOfLines={2} className="font-poppins-bold text-sm leading-5 text-primary">
          {journal.name}
        </Text>

        <View className="mt-1.5 flex-row items-center gap-1.5">
          <Building2 size={12} color="#7A8494" />
          <Text numberOfLines={1} className="flex-1 font-poppins text-[11px] text-muted">
            {journal.publisher}
          </Text>
        </View>
        <View className="mt-0.5 flex-row items-center gap-1.5">
          <Award size={12} color="#7A8494" />
          <Text numberOfLines={1} className="flex-1 font-poppins-semibold text-[11px] text-muted">
            {indexLabel(journal.index)}
          </Text>
        </View>
        <View className="mt-0.5 flex-row items-center gap-1.5">
          <BookOpen size={12} color="#7A8494" />
          <Text numberOfLines={1} className="flex-1 font-poppins text-[11px] text-muted">
            {journal.scope}
          </Text>
        </View>

        <View className="mt-2 border-t border-line/40 pt-1.5">
          <Text numberOfLines={1} className="font-poppins text-[10px] text-muted">
            {journal.frequency} · {publicationCount} publikasi
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
