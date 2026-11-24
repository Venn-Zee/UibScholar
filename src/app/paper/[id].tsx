import { Button } from "@/src/components/ui/Button";
import { useSaved } from "@/src/context/saved";
import { researches } from "@/src/data/research";
import { abbreviateJournalIndex, formatAuthorList, formatCitationAuthor, indexLabel } from "@/src/lib/format";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Bookmark, Building2, Calendar, ChevronLeft, ExternalLink, Share2, User } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Share, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Tab = "ringkasan" | "info";

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View className="flex-1 items-center">
      <Text className="font-poppins-bold text-base text-primary">{value}</Text>
      <Text className="text-center font-poppins text-[10px] text-primary">{label}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row py-2">
      <Text className="w-[38%] pr-3 font-poppins text-sm text-primary">{label}</Text>
      <Text className="flex-1 font-poppins text-sm text-muted">{value}</Text>
    </View>
  );
}

export default function PaperDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { saved, toggleSave } = useSaved();
  const [tab, setTab] = useState<Tab>("ringkasan");

  const item = researches.find((r) => r.id === id);

  if (!item) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-surface">
        <Text className="font-poppins text-muted">Penelitian tidak ditemukan</Text>
      </SafeAreaView>
    );
  }

  const isSaved = saved.includes(item.id);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 pt-2">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <ChevronLeft size={26} color="#1F3F6E" />
        </Pressable>
        <Pressable onPress={() => toggleSave(item.id)} hitSlop={10}>
          <Bookmark size={24} color={isSaved ? "#F5B301" : "#1F3F6E"} fill={isSaved ? "#F5B301" : "transparent"} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mt-4 flex-row gap-4 px-6">
          {/* Kotak Index Jurnal */}
          <View
            style={{
              width: 72,
              height: 96,
              borderRadius: 16,
              backgroundColor: item.journalIndex ? "#1F3F6E" : "#4A80C4",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "white", fontSize: 24, fontFamily: "Poppins_700Bold", lineHeight: 30 }}>
              {item.journalIndex ? abbreviateJournalIndex(item.journalIndex) : "–"}
            </Text>
            {item.journalIndex ? (
              <Text
                style={{ color: "rgba(255,255,255,0.75)", fontSize: 8, fontFamily: "Poppins_400Regular", textAlign: "center", marginTop: 2, paddingHorizontal: 4 }}
                numberOfLines={2}
              >
                {indexLabel(item.journalIndex)}
              </Text>
            ) : null}
          </View>
          <View className="flex-1">
            <Text className="font-poppins-bold text-base leading-5 text-primary">{item.title}</Text>
            <Pressable
              onPress={() => router.push({ pathname: "/peneliti/[name]", params: { name: item.author } })}
              className="mt-2 flex-row items-center gap-1.5"
            >
              <User size={12} color="#7A8494" />
              <Text className="flex-1 font-poppins text-[11px] text-muted">
                {formatCitationAuthor(item.author, item.authors)}
              </Text>
            </Pressable>
            <View className="mt-1 flex-row items-center gap-1.5">
              <Building2 size={12} color="#7A8494" />
              <Text className="flex-1 font-poppins text-[11px] text-muted">{item.institution}</Text>
            </View>
          </View>
        </View>

        <View className="mt-3 flex-row items-center gap-1.5 px-6">
          <Calendar size={12} color="#7A8494" />
          <Text className="font-poppins text-[11px] text-muted">{item.publishedAt}</Text>
        </View>

        <View className="mt-4 flex-row px-6">
          <Stat value={item.views} label="Dilihat" />
          <Stat value={item.authorCitations} label="Sitasi Penelitian" />
          <Stat value={item.citations} label="Sitasi" />
        </View>

        <View className="mt-5 flex-row border-b border-line">
          {([["ringkasan", "Ringkasan"], ["info", "Informasi Umum"]] as const).map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              className={`flex-1 items-center py-3 ${tab === key ? "border-b-2 border-primary" : ""}`}
            >
              <Text className={`font-poppins-semibold text-sm ${tab === key ? "text-primary" : "text-muted"}`}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <View className="m-5 rounded-2xl border border-line bg-white p-5">
          {tab === "ringkasan" ? (
            <>
              <Text className="font-poppins-bold text-lg text-primary">Ringkasan</Text>
              <Text className="mt-2 font-poppins text-sm leading-6 text-muted">{item.abstract}</Text>
              <Text className="mb-2 mt-5 font-poppins-bold text-lg text-primary">Kata Kunci</Text>
              <View className="flex-row flex-wrap gap-2">
                {item.keywords.map((k) => (
                  <View key={k} className="rounded-full bg-info-bg px-3 py-1">
                    <Text className="font-poppins-medium text-[11px] uppercase text-info">{k}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <>
              <Text className="mb-2 font-poppins-bold text-lg text-primary">Informasi Umum</Text>
              <InfoRow label="Penulis" value={formatAuthorList(item.author, item.authors)} />
              <InfoRow label="Indexing Jurnal" value={indexLabel(item.journalIndex)} />
              <InfoRow label="Jurnal" value={item.journal} />
              <InfoRow label="Tahun Terbit" value={String(item.year)} />
              <InfoRow label="Program Studi" value={item.studyProgram} />
              <InfoRow label="Metode" value={item.method} />
              <InfoRow label="Volume" value={item.volume} />
              <InfoRow label="Issue" value={item.issue} />
              <InfoRow label="Halaman di Issue" value={item.pageRange} />
              <InfoRow label="Bahasa" value={item.language} />
            </>
          )}
        </View>
      </ScrollView>

      <View className="flex-row items-center gap-3 border-t border-line bg-white px-5 py-3">
        <Pressable
          onPress={() => Share.share({ message: `${item.title}\n${item.link}` })}
          className="h-11 w-11 items-center justify-center rounded-lg border border-primary"
        >
          <Share2 size={18} color="#1F3F6E" />
        </Pressable>
        <Pressable
          onPress={() => WebBrowser.openBrowserAsync(item.link)}
          className="h-11 w-11 items-center justify-center rounded-lg border border-primary"
        >
          <ExternalLink size={18} color="#1F3F6E" />
        </Pressable>
        <View className="flex-1">
          <Button label="Bandingkan Jurnal" onPress={() => router.push({ pathname: "/compare", params: { a: item.id } })} />
        </View>
      </View>
    </SafeAreaView>
  );
}
