// app/(analysis)/result.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://mako-fast-bobcat.ngrok-free.app/predict";

export default function ResultPage() {
  const router = useRouter();
  const { uri } = useLocalSearchParams<{ uri?: string }>();

  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [overlay, setOverlay] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const sendToAI = async () => {
    if (!uri) return;
    setLoading(true);
    setErr(null);
    setCount(null);
    setOverlay(null);
    try {
      const form = new FormData();
      if (Platform.OS === "web") {
        const blob = await fetch(uri).then((r) => r.blob());
        form.append(
          "file",
          new File([blob], "parcel.png", { type: "image/png" })
        );
      } else {
        form.append("file", {
          uri,
          name: "parcel.png",
          type: "image/png",
        } as any);
      }
      const res = await fetch(API_URL, { method: "POST", body: form });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setCount(
        typeof json?.predicted_count === "number" ? json.predicted_count : null
      );
      setOverlay(
        typeof json?.overlay_image_base64 === "string"
          ? json.overlay_image_base64
          : null
      );
    } catch (e: any) {
      setErr(e?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    sendToAI();
  }, [uri]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b0b0b" }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Tiêu đề */}
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
          Your land parcel
        </Text>

        {/* Ảnh gốc */}
        <View
          style={{
            backgroundColor: "#1f2937",
            borderRadius: 12,
            padding: 12,
            alignItems: "center",
          }}
        >
          {uri ? (
            <Image
              source={{ uri }}
              style={{
                width: 224,
                height: 224,
                borderRadius: 12,
              }}
            />
          ) : (
            <Text style={{ color: "#bbb" }}>No image available</Text>
          )}
        </View>

        {/* Nút điều hướng */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={() => router.push("/(tabs)/maps")}
            style={{
              flex: 1,
              backgroundColor: "#374151",
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              Back to map
            </Text>
          </Pressable>

          <Pressable
            disabled={loading || !uri}
            onPress={sendToAI}
            style={{
              flex: 1,
              backgroundColor: loading || !uri ? "#4b5563" : "#16a34a",
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                Submit analysis
              </Text>
            )}
          </Pressable>
        </View>

        {/* Lỗi */}
        {err && (
          <View
            style={{
              backgroundColor: "#451a1a",
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: "#7f1d1d",
            }}
          >
            <Text style={{ color: "#fecaca" }}>Error: {err}</Text>
          </View>
        )}

        {/* Kết quả AI */}
        {count !== null && (
          <View
            style={{
              backgroundColor: "#112615",
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: "#14532d",
              gap: 6,
            }}
          >
            <Text style={{ color: "#6ee7b7", fontSize: 14 }}>AI result</Text>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
              {count.toFixed(2)} Estimated tree count
            </Text>
          </View>
        )}

        {/* Overlay */}
        {overlay && (
          <View
            style={{
              backgroundColor: "#1f2937",
              borderRadius: 12,
              padding: 12,
              gap: 8,
            }}
          >
            <Text style={{ color: "#9ca3af" }}>Server overlay</Text>
            <Image
              source={{ uri: `data:image/jpeg;base64,${overlay}` }}
              style={{
                width: "100%",
                height: 300,
                borderRadius: 12,
              }}
              resizeMode="contain"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
