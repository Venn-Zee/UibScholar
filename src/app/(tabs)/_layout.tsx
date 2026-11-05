import { useAuth } from "@/src/context/auth";
import { Redirect, Tabs } from "expo-router";
import { BookOpen, House, Search, User } from "lucide-react-native";
import { useResponsive } from "@/src/hooks/use-responsive";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { contentWidth } = useResponsive();
  // Di tablet, tab bar tetap ringkas dan di tengah (maks. 560), tidak melebar selebar layar.
  const sideMargin = Math.max(12, (contentWidth - 560) / 2);

  // Route guard sementara: tanpa login tidak boleh masuk tab.
  // Saat backend siap, cek token dari secure storage di sini.
  if (!user) return <Redirect href="/welcome" />;
  if (user.role !== "Umum" && user.approvalStatus !== "approved") {
    return <Redirect href="/approval" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1F3F6E",
        tabBarInactiveTintColor: "#7A8494",
        tabBarLabelStyle: { fontFamily: "Poppins_500Medium", fontSize: 11 },
        tabBarStyle: {
          position: "absolute",
          left: sideMargin,
          right: sideMargin,
          // Hindari tertutup gesture bar / home indicator di HP dengan layar berbeda-beda.
          bottom: Math.max(insets.bottom, 12),
          height: 68,
          paddingTop: 8,
          borderRadius: 24,
          borderTopWidth: 0,
          backgroundColor: "#fff",
          elevation: 8,
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ color }) => <House color={color} size={22} /> }} />
      <Tabs.Screen name="explore" options={{ title: "Explore", tabBarIcon: ({ color }) => <Search color={color} size={22} /> }} />
      <Tabs.Screen name="saved" options={{ title: "Saved", tabBarIcon: ({ color }) => <BookOpen color={color} size={22} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <User color={color} size={22} /> }} />
    </Tabs>
  );
}
