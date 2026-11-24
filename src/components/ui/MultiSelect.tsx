import { Check, ChevronDown, Search, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Props = {
  label: string;
  values: string[];
  options: readonly string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
};

/** Dropdown pilihan ganda dengan pencarian dinamis (menyaring saat user mengetik). */
export function MultiSelect({
  label,
  values,
  options,
  onChange,
  placeholder = "Semua",
  searchPlaceholder = "Cari...",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  const toggle = (opt: string) =>
    onChange(values.includes(opt) ? values.filter((v) => v !== opt) : [...values, opt]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const summary =
    values.length === 0 ? placeholder : values.length <= 2 ? values.join(", ") : `${values.length} dipilih`;

  return (
    <View className="w-full">
      <Text className="mb-1.5 font-poppins-semibold text-sm text-primary">{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={{ minHeight: 48 }}
        className="flex-row items-center justify-between rounded-lg border border-field bg-white px-4 py-2"
      >
        <Text
          numberOfLines={1}
          className={`mr-2 flex-1 font-poppins text-sm ${values.length ? "text-primary" : "text-muted"}`}
        >
          {summary}
        </Text>
        {values.length > 0 && (
          <View className="mr-2 h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1">
            <Text className="font-poppins-bold text-[10px] text-primary">{values.length}</Text>
          </View>
        )}
        <ChevronDown size={18} color="#1F3F6E" />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View className="flex-1 justify-end bg-black/40">
            {/* Latar untuk menutup; terpisah dari sheet agar mengetik/tap di sheet tidak menutup. */}
            <Pressable style={StyleSheet.absoluteFill} onPress={close} />
            <View
              style={{ maxHeight: "75%" }}
              className="w-full max-w-[560px] self-center rounded-t-3xl bg-white px-5 pb-6 pt-5"
            >
              <Text className="mb-3 font-poppins-bold text-lg text-primary">{label}</Text>

              <View className="mb-2 h-11 flex-row items-center gap-2 rounded-full border border-field bg-white px-4">
                <Search size={16} color="#1F3F6E" />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={searchPlaceholder}
                  placeholderTextColor="#9AA3B2"
                  autoCorrect={false}
                  className="flex-1 font-poppins text-sm text-primary"
                />
                {query.length > 0 && (
                  <Pressable onPress={() => setQuery("")} hitSlop={8}>
                    <X size={16} color="#7A8494" />
                  </Pressable>
                )}
              </View>

              <FlatList
                data={filtered}
                keyExtractor={(o) => o}
                keyboardShouldPersistTaps="handled"
                style={{ flexGrow: 0 }}
                renderItem={({ item }) => {
                  const selected = values.includes(item);
                  return (
                    <Pressable
                      onPress={() => toggle(item)}
                      className="flex-row items-center gap-3 border-b border-line py-3"
                    >
                      <View
                        className={`h-5 w-5 items-center justify-center rounded border-2 ${
                          selected ? "border-primary bg-primary" : "border-field bg-white"
                        }`}
                      >
                        {selected && <Check size={12} color="white" strokeWidth={3} />}
                      </View>
                      <Text className={`flex-1 font-poppins text-sm ${selected ? "text-primary" : "text-muted"}`}>
                        {item}
                      </Text>
                    </Pressable>
                  );
                }}
                ListEmptyComponent={
                  <Text className="py-6 text-center font-poppins text-sm text-muted">
                    Tidak ada hasil untuk “{query}”.
                  </Text>
                }
              />

              <View className="mt-4 flex-row gap-3">
                <Pressable
                  onPress={() => onChange([])}
                  disabled={values.length === 0}
                  className={`h-11 flex-1 items-center justify-center rounded-lg border border-field bg-white active:opacity-80 ${
                    values.length === 0 ? "opacity-40" : ""
                  }`}
                >
                  <Text className="font-poppins-semibold text-sm text-black">Hapus Pilihan</Text>
                </Pressable>
                <Pressable
                  onPress={close}
                  className="h-11 flex-[1.4] items-center justify-center rounded-lg bg-primary active:opacity-80"
                >
                  <Text className="font-poppins-semibold text-sm text-white">
                    Selesai{values.length ? ` (${values.length})` : ""}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
