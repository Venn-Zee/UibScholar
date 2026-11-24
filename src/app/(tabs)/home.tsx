import { BannerCarousel } from "@/src/components/BannerCarousel";
import { BellButton } from "@/src/components/BellButton";
import { CardGrid } from "@/src/components/CardGrid";
import { JournalCard } from "@/src/components/JournalCard";
import { ResearchCard } from "@/src/components/ResearchCard";
import { Shortcuts } from "@/src/components/Shortcuts";
import { useSaved } from "@/src/context/saved";
import { Journal } from "@/src/data/journals";
import { researches } from "@/src/data/research";
import { fetchJournals } from "@/src/lib/journals";
import { useRouter } from "expo-router";
import { ChevronRight, Search } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll: () => void }) {
  return (
    <View className="mb-3 mt-6 flex-row items-center justify-between">
      <Text className="font-poppins-bold text-lg text-primary">{title}</Text>
      <Pressable onPress={onSeeAll} className="flex-row items-center gap-1" hitSlop={8}>
        <Text className="font-poppins text-xs text-primary">See All</Text>
        <ChevronRight size={14} color="#1F3F6E" />
      </Pressable>
    </View>
  );
}

export default function Home() {
  const router = useRouter();
  const { saved, toggleSave } = useSaved();

  const latest = researches.slice(0, 3);
  const recommended = researches.slice(3, 6);

  // Jurnal dengan publikasi terbanyak di aplikasi tampil lebih dulu.
  const [journals, setJournals] = useState<Journal[]>([]);
  useEffect(() => {
    let active = true;
    fetchJournals().then(({ data }) => active && setJournals(data));
    return () => {
      active = false;
    };
  }, []);
  const featuredJournals = [...journals]
    .sort(
      (a, b) =>
        researches.filter((r) => r.journal === b.name).length -
        researches.filter((r) => r.journal === a.name).length,
    )
    .slice(0, 3);

  const renderCard = (id: string) => {
    const item = researches.find((r) => r.id === id)!;
    return (
      <ResearchCard
        key={item.id}
        item={item}
        saved={saved.includes(item.id)}
        onToggleSave={() => toggleSave(item.id)}
        onPress={() => router.push({ pathname: "/paper/[id]", params: { id: item.id } })}
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <ScrollView contentContainerClassName="px-5 pb-32 pt-2" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between">
          <Text className="font-poppins-bold text-3xl text-primary">UIBScholar</Text>
          <BellButton />
        </View>

        <Pressable
          onPress={() => router.push("/explore")}
          className="mt-4 h-12 flex-row items-center gap-3 rounded-full border border-field bg-white px-4"
        >
          <Search size={18} color="#1F3F6E" />
          <Text className="font-poppins text-sm text-muted">Cari penelitian, dosen, atau topik...</Text>
        </Pressable>

        <BannerCarousel />
        <Shortcuts />

        <SectionHeader title="Penelitian Terkini" onSeeAll={() => router.push("/explore")} />
        <CardGrid>{latest.map((r) => renderCard(r.id))}</CardGrid>

        <SectionHeader title="Rekomendasi Untukmu" onSeeAll={() => router.push("/explore")} />
        <CardGrid>{recommended.map((r) => renderCard(r.id))}</CardGrid>

        <SectionHeader title="Jurnal Publikasi" onSeeAll={() => router.push("/jurnal" as never)} />
        <CardGrid>
          {featuredJournals.map((j) => (
            <JournalCard
              key={j.id}
              journal={j}
              publicationCount={researches.filter((r) => r.journal === j.name).length}
              onPress={() => router.push({ pathname: "/compare", params: { j: j.id } })}
            />
          ))}
        </CardGrid>
      </ScrollView>
    </SafeAreaView>
  );
}
