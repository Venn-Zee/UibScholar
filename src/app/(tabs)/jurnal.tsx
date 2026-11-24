import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { Journal } from "@/src/data/journals";
import { researches } from "@/src/data/research";
import { useResponsive } from "@/src/hooks/use-responsive";
import { abbreviateJournalIndex, indexGroup, indexLabel } from "@/src/lib/format";
import { fetchJournals } from "@/src/lib/journals";
import { useRouter } from "expo-router";
import { GitCompare, Search } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const GROUPS = ["Semua", "Scopus", "Sinta"] as const;
type Group = (typeof GROUPS)[number];

function indexColor(index: string): string {
  if (/^(sinta\s*1|q1)$/i.test(index)) return "#0F2D57";
  if (/^(sinta\s*2|q2)$/i.test(index)) return "#1F3F6E";
  if (/^(sinta\s*3|q3)$/i.test(index)) return "#2B5494";
  if (/^(sinta\s*4|q4)$/i.test(index)) return "#3B6CB0";
  return "#4A80C4";
}

export default function JurnalList() {
  const router = useRouter();
  const { columns, gridItemWidth, gridGap } = useResponsive();
  const [list, setList] = useState<Journal[]>([]);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<Group>("Semua");

  useEffect(() => {
    let active = true;
    fetchJournals().then(({ data }) => active && setList(data));
    return () => {
      active = false;
    };
  }, []);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((j) => {
      if (group !== "Semua" && indexGroup(j.index) !== group) return false;
      if (!q) return true;
      return [j.name, j.publisher, j.scope, j.index, indexLabel(j.index), ...j.topics].join(" ").toLowerCase().includes(q);
    });
  }, [list, query, group]);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <ScreenHeader title="Daftar Jurnal" hideBack />
      <View className="mx-5 mb-3 h-12 flex-row items-center gap-2 rounded-full border border-field bg-white px-4">
        <Search size={18} color="#1F3F6E" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Cari jurnal, penerbit, atau topik..."
          placeholderTextColor="#9AA3B2"
          className="flex-1 font-poppins text-sm text-primary"
        />
      </View>

      <View className="mx-5 mb-3 flex-row gap-2">
        {GROUPS.map((g) => (
          <Pressable
            key={g}
            onPress={() => setGroup(g)}
            className={`rounded-full border px-4 py-1.5 ${group === g ? "border-primary bg-primary" : "border-line bg-white"}`}
          >
            <Text className={`font-poppins-medium text-xs ${group === g ? "text-white" : "text-muted"}`}>{g}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        key={columns}
        data={items}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? { gap: gridGap } : undefined}
        keyExtractor={(j) => j.id}
        contentContainerClassName="gap-3 px-5 pb-32"
        renderItem={({ item }) => {
          const count = researches.filter((r) => r.journal === item.name).length;
          return (
            <View style={gridItemWidth ? { width: gridItemWidth } : undefined}>
              <View className="grow rounded-2xl border border-line bg-white p-3.5">
                <View className="flex-row gap-3">
                  <View
                    style={{ backgroundColor: indexColor(item.index), width: 56, height: 56, borderRadius: 12, alignItems: "center", justifyContent: "center" }}
                  >
                    <Text style={{ color: "white", fontSize: 18, fontFamily: "Poppins_700Bold" }}>
                      {abbreviateJournalIndex(item.index)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text numberOfLines={2} className="font-poppins-bold text-sm leading-5 text-primary">
                      {item.name}
                    </Text>
                    <Text className="font-poppins text-[11px] text-muted">
                      {indexLabel(item.index)} · {item.scope}
                    </Text>
                  </View>
                </View>

                <Text numberOfLines={1} className="mt-2 font-poppins text-[11px] text-muted">
                  {item.publisher}
                </Text>
                <Text className="font-poppins text-[11px] text-muted">
                  {item.frequency} · {item.accessType} · {count} publikasi di aplikasi
                </Text>

                <View className="mt-2 flex-row flex-wrap gap-1.5">
                  {item.topics.slice(0, 4).map((t) => (
                    <View key={t} className="rounded-full bg-[#E8F1FD] px-2 py-0.5">
                      <Text className="font-poppins text-[9px] text-[#1A6FE0]">{t}</Text>
                    </View>
                  ))}
                </View>

                <Pressable
                  onPress={() => router.push({ pathname: "/compare", params: { j: item.id } })}
                  className="mt-3 flex-row items-center justify-center gap-1.5 self-start rounded-lg border border-primary px-3 py-1.5 active:opacity-80"
                >
                  <GitCompare size={13} color="#1F3F6E" />
                  <Text className="font-poppins-semibold text-[11px] text-primary">Bandingkan Jurnal</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text className="mt-10 text-center font-poppins text-sm text-muted">Jurnal tidak ditemukan.</Text>
        }
      />
    </SafeAreaView>
  );
}
