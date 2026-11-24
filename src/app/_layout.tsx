import { AuthProvider } from "@/src/context/auth";
import { FilterProvider } from "@/src/context/filters";
import { SavedProvider } from "@/src/context/saved";
import { frameMaxWidth } from "@/src/hooks/use-responsive";
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import "../global.css";

SplashScreen.preventAutoHideAsync();

export function SuspenseFallback() {
  return null;
}

export default function RootLayout() {
  const pathname = usePathname();

    useEffect(() => {
      console.log("CURRENT MOBILE ROUTE:", pathname);
    }, [pathname]);
    
  const [loaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AuthProvider>
      <SavedProvider>
        <FilterProvider>
          <StatusBar style="dark" />
          {/* Kolom aplikasi: di HP memenuhi layar, di tablet/web dibatasi lebarnya dan dipusatkan. */}
          <View style={{ flex: 1, alignItems: "center", backgroundColor: "#D9E6F2" }}>
            <View style={{ flex: 1, width: "100%", maxWidth: frameMaxWidth(pathname) }}>
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#EAF3FB" } }}>
                <Stack.Screen name="filter" options={{ presentation: "modal" }} />
              </Stack>
            </View>
          </View>
        </FilterProvider>
      </SavedProvider>
    </AuthProvider>
  );
}
