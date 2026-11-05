import { useSaved } from "@/src/context/saved";
import { researches } from "@/src/data/research";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Bookmark,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  User,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabType = "publikasi" | "tentang";

function getFaculty(program: string): string {
  const p = (program ?? "").toLowerCase();
  if (p.includes("sistem informasi") || p.includes("teknik informatika") || p.includes("komputer")) {
    return "Ilmu Komputer";
  }
  if (p.includes("manajemen") || p.includes("akuntansi") || p.includes("pariwisata") || p.includes("bisnis")) {
    return "Bisnis dan Manajemen";
  }
  if (p.includes("sipil") || p.includes("arsitektur") || p.includes("elektro") || p.includes("teknik")) {
    return "Teknik Sipil dan Perencanaan";
  }
  if (p.includes("hukum")) {
    return "Hukum";
  }
  return "Ilmu Komputer";
}

function getCleanName(fullName: string): string {
  if (!fullName) return "-";
  return fullName.split(",")[0].replace(/^(Dr\.|Prof\.|Ir\.)\s*/i, "").trim();
}

function getRole(fullName: string): string {
  if (fullName.includes(",") || fullName.includes("M.") || fullName.includes("S.")) {
    return "Dosen";
  }
  return "Mahasiswa";
}

export default function ResearcherProfile() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { saved, toggleSave } = useSaved();

  const [activeTab, setActiveTab] = useState<TabType>("publikasi");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "citations">("newest");

  const displayName = typeof name === "string" ? name : "Peneliti";
  const items = useMemo(() => researches.filter((r) => r.author === displayName), [displayName]);
  const first = items[0];

  const cleanName = getCleanName(displayName);
  const role = getRole(displayName);
  const faculty = getFaculty(first?.studyProgram ?? "Sistem Informasi");

  const totalCitations = items.reduce((sum, r) => sum + r.citations, 0);
  const authorCitations = first?.authorCitations ?? (totalCitations > 0 ? totalCitations : 70);
  const hIndex = 20;
  const publicationCount = items.length >= 3 ? items.length : 50;

  const filteredItems = useMemo(() => {
    let list = items;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.abstract.toLowerCase().includes(q) ||
          r.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }
    if (sortOrder === "citations") {
      list = [...list].sort((a, b) => b.citations - a.citations);
    } else {
      list = [...list].sort((a, b) => b.year - a.year);
    }
    return list;
  }, [items, searchQuery, sortOrder]);

  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <View className="w-full max-w-[760px] self-center bg-white shadow-xs">
          {/* Cover Banner */}
          <View className="relative h-48 w-full overflow-hidden bg-[#CBD5E1]">
            <Image
              source={require("@/assets/images/campus-uib.jpg")}
              className="h-full w-full"
              resizeMode="cover"
            />
            {/* Back Button Floating */}
            <Pressable
              onPress={() => router.canGoBack() ? router.back() : router.replace("/peneliti")}
              style={{
                position: "absolute",
                top: Math.max(insets.top, 14) + 6,
                left: 18,
                zIndex: 10,
              }}
              className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-md active:opacity-80"
              hitSlop={8}
            >
              <ChevronLeft size={22} color="#1F3F6E" />
            </Pressable>
          </View>

          {/* Profile Card Overlay */}
          <View className="-mt-8 rounded-t-[32px] bg-white px-5 pt-0">
            {/* Circular Avatar */}
            <View className="-mt-14 items-center">
              <View className="h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-[#64748B] shadow-md">
                <User size={54} color="#FFFFFF" />
              </View>
            </View>

            {/* Name */}
            <Text className="mt-3 text-center font-poppins-bold text-xl text-primary">
              {displayName}
            </Text>

            {/* Verified Badge */}
            <View className="mt-1.5 flex-row items-center gap-1 self-center rounded-full bg-[#22C55E] px-2.5 py-0.5">
              <Check size={11} color="#FFFFFF" strokeWidth={3} />
              <Text className="font-poppins-semibold text-[11px] text-white">Verified</Text>
            </View>

            {/* Program & Institution */}
            <View className="mt-2 items-center">
              <Text className="text-center font-poppins text-xs text-muted">
                {first?.studyProgram || "Sistem Informasi"}
              </Text>
              <Text className="mt-0.5 text-center font-poppins text-xs text-muted">
                {first?.institution || "Universitas Internasional Batam"}
              </Text>
            </View>

            {/* Stats Row */}
            <View className="mt-5 flex-row items-center justify-around rounded-2xl bg-surface/40 py-2.5 px-3">
              <View className="flex-1 items-center">
                <Text className="font-poppins-bold text-base text-primary">{hIndex}</Text>
                <Text className="mt-0.5 font-poppins text-[10px] text-muted">H-Index</Text>
              </View>
              <View style={{ height: 28, width: 1, backgroundColor: "#D1D5DB" }} />
              <View className="flex-1 items-center">
                <Text className="font-poppins-bold text-base text-primary">{authorCitations}</Text>
                <Text className="mt-0.5 font-poppins text-[10px] text-muted">Sitasi Penelitian</Text>
              </View>
              <View style={{ height: 28, width: 1, backgroundColor: "#D1D5DB" }} />
              <View className="flex-1 items-center">
                <Text className="font-poppins-bold text-base text-primary">{publicationCount}</Text>
                <Text className="mt-0.5 font-poppins text-[10px] text-muted">Publikasi</Text>
              </View>
            </View>

            {/* Tabs Header */}
            <View className="mt-6 flex-row border-b border-line">
              <Pressable
                onPress={() => setActiveTab("publikasi")}
                className={`flex-1 items-center pb-3 ${
                  activeTab === "publikasi" ? "border-b-2 border-primary" : ""
                }`}
              >
                <Text
                  className={`text-sm ${
                    activeTab === "publikasi"
                      ? "font-poppins-semibold text-primary"
                      : "font-poppins-medium text-muted"
                  }`}
                >
                  Publikasi
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab("tentang")}
                className={`flex-1 items-center pb-3 ${
                  activeTab === "tentang" ? "border-b-2 border-primary" : ""
                }`}
              >
                <Text
                  className={`text-sm ${
                    activeTab === "tentang"
                      ? "font-poppins-semibold text-primary"
                      : "font-poppins-medium text-muted"
                  }`}
                >
                  Tentang
                </Text>
              </Pressable>
            </View>

            {/* Tab 1: Publikasi */}
            {activeTab === "publikasi" && (
              <View className="mt-4">
                {/* Search Bar + Sort Button */}
                <View className="mb-4 flex-row items-center gap-2.5">
                  <View className="h-11 flex-1 flex-row items-center gap-2 rounded-full border border-line bg-white px-4">
                    <Search size={18} color="#7A8494" />
                    <TextInput
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="Cari penelitian"
                      placeholderTextColor="#9AA3B2"
                      className="flex-1 font-poppins text-sm text-primary"
                    />
                  </View>

                  <Pressable
                    onPress={() =>
                      setSortOrder((prev) => (prev === "newest" ? "citations" : "newest"))
                    }
                    className="h-11 w-11 items-center justify-center rounded-full border border-line bg-white active:opacity-80"
                    hitSlop={8}
                  >
                    <SlidersHorizontal size={18} color="#1F3F6E" />
                  </Pressable>
                </View>

                {/* Research Cards List */}
                {filteredItems.length === 0 ? (
                  <View className="items-center py-12">
                    <Text className="font-poppins text-sm text-muted">
                      Tidak ada penelitian yang ditemukan.
                    </Text>
                  </View>
                ) : (
                  filteredItems.map((item) => {
                    const isSaved = saved.includes(item.id);
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() =>
                          router.push({
                            pathname: "/paper/[id]",
                            params: { id: item.id },
                          })
                        }
                        className="mb-3.5 flex-row rounded-2xl border border-line bg-white p-3.5 shadow-sm active:opacity-90"
                      >
                        {/* Thumbnail Document Preview */}
                        <View className="h-20 w-16 items-center justify-center rounded-xl border border-line bg-surface p-1">
                          <View className="h-full w-full rounded-md bg-white p-1.5 shadow-xs">
                            <View className="h-1.5 w-6 rounded bg-[#CBD5E1]" />
                            <View className="mt-1 h-1 w-full rounded bg-[#E2E8F0]" />
                            <View className="mt-0.5 h-1 w-full rounded bg-[#E2E8F0]" />
                            <View className="mt-0.5 h-1 w-4/5 rounded bg-[#E2E8F0]" />
                            <View className="mt-1.5 h-1 w-full rounded bg-[#E2E8F0]" />
                            <View className="mt-0.5 h-1 w-3/4 rounded bg-[#E2E8F0]" />
                          </View>
                        </View>

                        {/* Center Info */}
                        <View className="ml-3 flex-1 justify-between py-0.5 pr-1">
                          <Text
                            numberOfLines={2}
                            className="font-poppins-bold text-sm leading-5 text-primary"
                          >
                            {item.title}
                          </Text>

                          <View className="mt-1 flex-row items-center gap-1.5">
                            <User size={12} color="#7A8494" />
                            <Text
                              numberOfLines={1}
                              className="flex-1 font-poppins text-[11px] text-muted"
                            >
                              {item.author}
                            </Text>
                          </View>

                          <View className="mt-0.5 flex-row items-center gap-1.5">
                            <Building2 size={12} color="#7A8494" />
                            <Text
                              numberOfLines={1}
                              className="flex-1 font-poppins text-[11px] text-muted"
                            >
                              {item.institution}
                            </Text>
                          </View>
                        </View>

                        {/* Right: Bookmark, Arrow, Date */}
                        <View className="items-end justify-between py-0.5 pl-1">
                          <Pressable onPress={() => toggleSave(item.id)} hitSlop={10}>
                            <Bookmark
                              size={18}
                              color={isSaved ? "#F5B301" : "#7A8494"}
                              fill={isSaved ? "#F5B301" : "transparent"}
                            />
                          </Pressable>

                          <ChevronRight size={18} color="#1F3F6E" />

                          <Text className="font-poppins text-[10px] text-muted">
                            {item.publishedAt}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </View>
            )}

            {/* Tab 2: Tentang */}
            {activeTab === "tentang" && (
              <View className="pt-5 pb-8">
                <Text className="mb-4 font-poppins-bold text-base text-primary">
                  Informasi Umum
                </Text>

                <View>
                  {/* Row: Nama Lengkap */}
                  <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                    <Text style={{ width: 130 }} className="font-poppins text-sm text-[#7A8494]">
                      Nama Lengkap
                    </Text>
                    <Text style={{ flex: 1 }} className="font-poppins-medium text-sm text-primary">
                      {cleanName}
                    </Text>
                  </View>

                  {/* Row: Peran */}
                  <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                    <Text style={{ width: 130 }} className="font-poppins text-sm text-[#7A8494]">Peran</Text>
                    <Text style={{ flex: 1 }} className="font-poppins-medium text-sm text-primary">
                      {role}
                    </Text>
                  </View>

                  {/* Row: Program Studi */}
                  <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                    <Text style={{ width: 130 }} className="font-poppins text-sm text-[#7A8494]">
                      Program Studi
                    </Text>
                    <Text style={{ flex: 1 }} className="font-poppins-medium text-sm text-primary">
                      {first?.studyProgram || "Sistem Informasi"}
                    </Text>
                  </View>

                  {/* Row: Fakultas */}
                  <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                    <Text style={{ width: 130 }} className="font-poppins text-sm text-[#7A8494]">Fakultas</Text>
                    <Text style={{ flex: 1 }} className="font-poppins-medium text-sm text-primary">
                      {faculty}
                    </Text>
                  </View>

                  {/* Row: Email */}
                  <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                    <Text style={{ width: 130 }} className="font-poppins text-sm text-[#7A8494]">Email</Text>
                    <Text style={{ flex: 1 }} className="font-poppins-medium text-sm text-muted">...</Text>
                  </View>

                  {/* Row: Status */}
                  <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10 }}>
                    <Text style={{ width: 130 }} className="font-poppins text-sm text-[#7A8494]">Status</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#22C55E", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
                      <Check size={11} color="#FFFFFF" strokeWidth={3} />
                      <Text style={{ color: "#FFFFFF", fontSize: 11 }} className="font-poppins-semibold">
                        Verified
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
