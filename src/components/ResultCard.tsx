import { ResearchCard } from "@/src/components/ResearchCard";
import { Research } from "@/src/types/research";

type Props = {
  item: Research;
  saved?: boolean;
  onToggleSave?: () => void;
  onPress?: () => void;
};

export function ResultCard({ item, saved, onToggleSave, onPress }: Props) {
  return (
    <ResearchCard
      item={item}
      saved={saved}
      onToggleSave={onToggleSave}
      onPress={onPress}
    />
  );
}
