import { MultiSelect } from "@/src/components/ui/MultiSelect";
import { ScreenHeader } from "@/src/components/ui/ScreenHeader";
import { Select } from "@/src/components/ui/Select";
import { useFilters } from "@/src/context/filters";
import { PUBLICATION_TYPES, STUDY_PROGRAMS } from "@/src/data/programs";
import { emptyFilters, uniqueTopics, uniqueYears } from "@/src/lib/search";
import { Filters } from "@/src/types/research";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const RESEARCH_METHODS = [
  "Kualitatif",
  "Kuantitatif",
  "Mixed Methods",
  "Eksperimental",
  "Studi Kasus",
  "Deskriptif",
  "Yuridis Normatif",
  "Yuridis Empiris",
  "R&D",
  "Survei",
];

export default function FilterScreen() {
  const router = useRouter();
  const { filters, setFilters } = useFilters();
  const [draft, setDraft] = useState<Filters>(filters);
  const patch = (p: Partial<Filters>) => setDraft((d) => ({ ...d, ...p }));

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader title="Filter" />
      <ScrollView contentContainerClassName="gap-5 px-5 pb-8" keyboardShouldPersistTaps="handled">
        <Select
          label="Program Studi"
          value={draft.studyProgram}
          options={STUDY_PROGRAMS}
          onChange={(v) => patch({ studyProgram: v })}
        />
        <Select
          label="Tahun Publikasi"
          value={draft.year}
          options={uniqueYears()}
          onChange={(v) => patch({ year: v })}
        />
        <Select
          label="Jenis Publikasi / Indexing"
          value={draft.publicationType}
          options={PUBLICATION_TYPES}
          onChange={(v) => patch({ publicationType: v })}
        />
        <MultiSelect
          label="Topik"
          values={draft.topics}
          options={uniqueTopics()}
          onChange={(v) => patch({ topics: v })}
          searchPlaceholder="Cari topik..."
        />

        <MultiSelect
          label="Metode Penelitian"
          values={draft.methods}
          options={RESEARCH_METHODS}
          onChange={(v) => patch({ methods: v })}
          searchPlaceholder="Cari metode penelitian..."
        />

        <View className="mt-2 flex-row gap-3">
          <Pressable
            onPress={() => setDraft(emptyFilters)}
            className="h-12 flex-1 items-center justify-center rounded-lg border border-field bg-white active:opacity-80"
          >
            <Text className="font-poppins-semibold text-base text-black">Reset</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setFilters(draft);
              router.back();
            }}
            className="h-12 flex-[1.4] items-center justify-center rounded-lg bg-primary active:opacity-80"
          >
            <Text className="font-poppins-semibold text-base text-white">Terapkan</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
