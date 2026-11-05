import { LogOut, X } from "lucide-react-native";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function LogoutDialog({ visible, onCancel, onConfirm }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}
    >
      {/* Backdrop */}
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}
        onPress={onCancel}
      >
        {/* Dialog Card — stopPropagation agar tap di dalam tidak tutup modal */}
        <Pressable
          style={{ width: "100%", maxWidth: 360, backgroundColor: "#FFFFFF", borderRadius: 20, padding: 24, alignItems: "center" }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <LogOut size={28} color="#DC2626" />
          </View>

          {/* Title */}
          <Text className="font-poppins-bold text-lg text-primary" style={{ marginBottom: 8 }}>
            Keluar Akun
          </Text>

          {/* Body */}
          <Text className="font-poppins text-sm text-muted" style={{ textAlign: "center", marginBottom: 24, lineHeight: 20 }}>
            Apakah Anda yakin ingin keluar dari akun ini?
          </Text>

          {/* Buttons */}
          <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
            {/* Batal */}
            <Pressable
              onPress={onCancel}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#D1D5DB",
                alignItems: "center",
                justifyContent: "center",
              }}
              className="active:opacity-70"
            >
              <Text className="font-poppins-semibold text-sm text-primary">Batal</Text>
            </Pressable>

            {/* Keluar */}
            <Pressable
              onPress={onConfirm}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 12,
                backgroundColor: "#DC2626",
                alignItems: "center",
                justifyContent: "center",
              }}
              className="active:opacity-80"
            >
              <Text className="font-poppins-semibold text-sm text-white">Ya, Keluar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

