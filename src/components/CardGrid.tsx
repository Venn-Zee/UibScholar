import { Children, ReactNode } from "react";
import { View } from "react-native";
import { useResponsive } from "@/src/hooks/use-responsive";

/** Susunan kartu: 1 kolom di HP, 2-3 kolom di tablet. */
export function CardGrid({ children }: { children: ReactNode }) {
  const { gridItemWidth, gridGap } = useResponsive();

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: gridGap }}>
      {Children.map(children, (child) => (
        <View style={{ width: gridItemWidth ?? "100%" }}>{child}</View>
      ))}
    </View>
  );
}

