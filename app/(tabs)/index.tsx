import { Ionicons } from "@expo/vector-icons";
import { Href, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function TWButton({
  title,
  onPress,
  variant = "solid",
  leftIcon,
}: {
  title: string;
  onPress: () => void;
  variant?: "solid" | "outline" | "ghost";
  leftIcon?: keyof typeof Ionicons.glyphMap;
}) {
  const base = "flex-row items-center justify-center rounded-2xl px-4 py-3";
  const styles =
    variant === "solid"
      ? "bg-brand"
      : variant === "outline"
      ? "border border-gray-300"
      : "";
  const text =
    variant === "solid"
      ? "text-white font-semibold"
      : "text-gray-800 font-semibold";
  return (
    <Pressable className={`${base} ${styles}`} onPress={onPress}>
      {leftIcon ? (
        <Ionicons name={leftIcon} size={18} style={{ marginRight: 8 }} />
      ) : null}
      <Text className={text}>{title}</Text>
    </Pressable>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      {children}
    </View>
  );
}

export default function HomePage() {
  const router = useRouter();
  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-white">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            <Ionicons name="leaf-outline" size={22} />
            <Text className="ml-2 text-base font-semibold">REPO-BASED</Text>
            <Text className="ml-2 px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-xs">
              v1
            </Text>
          </View>
          <TWButton
            title="Đăng nhập"
            variant="ghost"
            onPress={() => router.push("/(auth)/signin" as Href)}
          />
          <TWButton
            title="Đăng ký"
            variant="ghost"
            onPress={() => router.push("/(auth)/signup" as Href)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
