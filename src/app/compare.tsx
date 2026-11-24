import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { Journal } from "@/src/data/journals";
import { researches } from "@/src/data/research";
import { abbreviateJournalIndex, indexLabel } from "@/src/lib/format";
import { fetchJournals } from "@/src/lib/journals";
import { useLocalSearchParams } from "expo-router";
import { ArrowRight, BookOpen } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function IndexBox({ index, size = 40 }: { index: string; size?: number }) {
  return (
    <View
      style={{ backgroundColor: "#1F3F6E", width: size, height: size, borderRadius: 10, alignItems: "center", justifyContent: "center" }}
    >
      <Text style={{ color: "white", fontSize: size * 0.32, fontFamily: "Poppins_700Bold" }}>
        {abbreviateJournalIndex(index)}
      </Text>
    </View>
  );
}

function JournalCard({ tag, journal, onChange }: { tag: string; journal: Journal; onChange: () => void }) {
  return (
    <View className="flex-1 rounded-2xl border border-line bg-white p-3 shadow-sm">
      <View className="flex-row items-center gap-2">
        <IndexBox index={journal.index} size={36} />
        <View className="flex-1">
          <Text className="font-poppins-bold text-[9px] text-info">{tag}</Text>
          <Text numberOfLines={2} className="font-poppins-semibold text-[10px] leading-4 text-primary">
            {journal.name}
          </Text>
        </View>
      </View>
      <Pressable onPress={onChange} hitSlop={8} className="mt-1 self-end">
        <Text className="font-poppins-medium text-[9px] text-info">Ganti</Text>
      </Pressable>
    </View>
  );
}

function Row({ label, a, b }: { label: string; a: string; b: string }) {
  const same = a === b;
  return (
    <View className="flex-row border-b border-line/60 py-3">
      <Text style={{ width: "26%" }} className="pr-2 font-poppins text-[11px] text-primary">
        {label}
      </Text>
      <Text className="flex-1 pr-2 font-poppins text-[11px] text-muted">{a || "-"}</Text>
      <Text className={`flex-1 font-poppins text-[11px] ${same ? "text-muted" : "font-poppins-semibold text-primary"}`}>
        {b || "-"}
      </Text>
    </View>
  );
}

function TopicChips({ topics }: { topics: string[] }) {
  return (
    <View className="flex-row flex-wrap gap-1.5">
      {topics.map((t) => (
        <View key={t} className="rounded-full bg-[#E8F1FD] px-2 py-0.5">
          <Text className="font-poppins text-[9px] text-[#1A6FE0]">{t}</Text>
        </View>
      ))}
    </View>
  );
}

function Picker({
  title,
  journals,
  excludeId,
  onPick,
  right,
}: {
  title: string;
  journals: Journal[];
  excludeId?: string;
  onPick: (j: Journal) => void;
  right?: React.ReactNode;
}) {
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScreenHeader title={title} right={right} />
      <ScrollView contentContainerClassName="gap-3 px-5 pb-10">
        {journals
          .filter((j) => j.id !== excludeId)
          .map((j) => (
            <Pressable
              key={j.id}
              onPress={() => onPick(j)}
              className="flex-row items-center gap-3 rounded-2xl border border-line bg-white p-3.5 active:opacity-80"
            >
              <IndexBox index={j.index} size={44} />
              <View className="flex-1">
                <Text numberOfLines={1} className="font-poppins-semibold text-xs text-primary">
                  {j.name}
                </Text>
                <Text className="font-poppins text-[10px] text-muted">
                  {indexLabel(j.index)} · {j.scope}
                </Text>
              </View>
              <ArrowRight size={16} color="#9AA3B2" />
            </Pressable>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function Compare() {
  // `a` = id penelitian (dari halaman detail); jurnalnya otomatis jadi Jurnal A.
  const { a, j } = useLocalSearchParams<{ a?: string; j?: string }>();
  const [list, setList] = useState<Journal[]>([]);
  const [source, setSource] = useState<"supabase" | "dummy">("dummy");
  const [loading, setLoading] = useState(true);
  const [jA, setJA] = useState<Journal | undefined>();
  const [jB, setJB] = useState<Journal | undefined>();

  useEffect(() => {
    let active = true;
    fetchJournals().then(({ data, source: src }) => {
      if (!active) return;
      setList(data);
      setSource(src);
      setLoading(false);
      const research = researches.find((r) => r.id === a);
      if (j) setJA(data.find((x) => x.id === j));
      else if (research) setJA(data.find((x) => x.name === research.journal));
    });
    return () => {
      active = false;
    };
  }, [a, j]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <ScreenHeader title="Bandingkan Jurnal" />
      </SafeAreaView>
    );
  }

  if (!jA) {
    return <Picker title="Pilih Jurnal A" journals={list} onPick={setJA} />;
  }

  if (!jB) {
    return (
      <Picker
        title="Pilih Jurnal B"
        journals={list}
        excludeId={jA.id}
        onPick={setJB}
        right={
          <Pressable onPress={() => setJA(undefined)} hitSlop={8}>
            <Text className="font-poppins-medium text-xs text-info">Ganti A</Text>
          </Pressable>
        }
      />
    );
  }

  const pubsOf = (j: Journal) => researches.filter((r) => r.journal === j.name);
  const yearsOf = (j: Journal) => {
    const ys = pubsOf(j).map((r) => r.year);
    if (ys.length === 0) return "-";
    const min = Math.min(...ys);
    const max = Math.max(...ys);
    return min === max ? String(min) : `${min} – ${max}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScreenHeader
        title="Bandingkan Jurnal"
        right={
          <Pressable
            onPress={() => {
              setJA(undefined);
              setJB(undefined);
            }}
            hitSlop={8}
          >
            <Text className="font-poppins-medium text-xs text-info">Ulang</Text>
          </Pressable>
        }
      />
      <ScrollView contentContainerClassName="pb-10" showsVerticalScrollIndicator={false}>
        <View className="flex-row gap-2 px-5 pb-3">
          <JournalCard tag="Jurnal A" journal={jA} onChange={() => setJA(undefined)} />
          <JournalCard tag="Jurnal B" journal={jB} onChange={() => setJB(undefined)} />
        </View>

        <View className="mx-5 rounded-2xl bg-white p-4">
          <View className="flex-row border-b border-line pb-2">
            <Text style={{ width: "26%" }} className="font-poppins-bold text-xs text-primary">
              Atribut
            </Text>
            <Text className="flex-1 font-poppins-bold text-xs text-primary">Jurnal A</Text>
            <Text className="flex-1 font-poppins-bold text-xs text-primary">Jurnal B</Text>
          </View>
          <Row label="Nama Jurnal" a={jA.name} b={jB.name} />
          <Row label="Indexing" a={indexLabel(jA.index)} b={indexLabel(jB.index)} />
          <Row label="Penerbit" a={jA.publisher} b={jB.publisher} />
          <Row label="Scope" a={jA.scope} b={jB.scope} />
          <Row label="Frekuensi Terbit" a={jA.frequency} b={jB.frequency} />
          <Row label="Akses" a={jA.accessType} b={jB.accessType} />
          <Row label="Bahasa" a={jA.language} b={jB.language} />
          <Row label="Negara" a={jA.country} b={jB.country} />
          <Row label="ISSN" a={jA.issn ?? "-"} b={jB.issn ?? "-"} />
          <Row label="Tahun Terbit di Aplikasi" a={yearsOf(jA)} b={yearsOf(jB)} />
          <Row label="Jumlah Publikasi" a={String(pubsOf(jA).length)} b={String(pubsOf(jB).length)} />
        </View>

        <View className="mx-5 mt-4 rounded-2xl bg-white p-4">
          <View className="mb-3 flex-row items-center gap-2">
            <BookOpen size={15} color="#1F3F6E" />
            <Text className="font-poppins-bold text-sm text-primary">Topik yang Dicakup</Text>
          </View>
          <Text className="mb-1.5 font-poppins-semibold text-[10px] text-info">Jurnal A</Text>
          <TopicChips topics={jA.topics} />
          <Text className="mb-1.5 mt-3 font-poppins-semibold text-[10px] text-info">Jurnal B</Text>
          <TopicChips topics={jB.topics} />
          <Text className="mb-1.5 mt-4 font-poppins-semibold text-[10px] text-primary">Topik yang sama</Text>
          {(() => {
            const common = jA.topics.filter((t) => jB.topics.some((x) => x.toLowerCase() === t.toLowerCase()));
            return common.length > 0 ? (
              <TopicChips topics={common} />
            ) : (
              <Text className="font-poppins text-[10px] text-muted">Tidak ada topik yang beririsan.</Text>
            );
          })()}
        </View>

        <View className="mx-5 mt-4 rounded-2xl bg-white p-4">
          <Text className="mb-3 font-poppins-bold text-sm text-primary">Publikasi di Aplikasi</Text>
          {[
            { tag: "Jurnal A", j: jA },
            { tag: "Jurnal B", j: jB },
          ].map(({ tag, j }) => (
            <View key={tag} className="mb-3">
              <Text className="mb-1.5 font-poppins-semibold text-[10px] text-info">{tag}</Text>
              {pubsOf(j).length === 0 ? (
                <Text className="font-poppins text-[10px] text-muted">Belum ada publikasi.</Text>
              ) : (
                pubsOf(j).map((r) => (
                  <View key={r.id} className="mb-1.5 rounded-lg border border-line bg-surface p-2">
                    <Text numberOfLines={2} className="font-poppins-semibold text-[11px] text-primary">
                      {r.title}
                    </Text>
                    <Text className="font-poppins text-[10px] text-muted">{r.publishedAt}</Text>
                  </View>
                ))
              )}
            </View>
          ))}
        </View>

        <Text className="mt-4 px-5 text-center font-poppins text-[10px] text-muted">
          Sumber data: {source === "supabase" ? "Supabase" : "data dummy (tabel journals belum tersedia)"}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
