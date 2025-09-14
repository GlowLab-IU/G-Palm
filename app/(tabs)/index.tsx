import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ScrollView, View, Text, Pressable } from "react-native";
import { Href, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

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
            <Text className="ml-2 text-base font-semibold">
              Nông trại 4C • PDA
            </Text>
            <Text className="ml-2 px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-xs">
              v1
            </Text>
          </View>
          <TWButton
            title="Đăng nhập"
            variant="ghost"
            onPress={() => router.push("/(auth)/login" as Href)}
          />
        </View>

        {/* Hero */}
        <View className="space-y-3 mt-2">
          <Text className="text-2xl font-bold">
            Ứng dụng quản lý nông trại thông minh
          </Text>
          <Text className="text-gray-700">
            Lập kế hoạch trồng trọt, quản lý vật tư, ghi nhật ký, phân tích tài
            chính và truy xuất nguồn gốc.
          </Text>
          <View className="flex-row gap-3 mt-2">
            <View className="flex-1">
              <TWButton
                title="Bắt đầu"
                leftIcon="rocket-outline"
                onPress={() => router.push("/(auth)/register" as Href)}
              />
            </View>
            <View className="flex-1">
              <TWButton
                title="Tôi đã có tài khoản"
                variant="outline"
                leftIcon="log-in-outline"
                onPress={() => router.push("/(auth)/login" as Href)}
              />
            </View>
          </View>
        </View>

        {/* Preview */}
        <Card>
          <View className="aspect-[16/9] bg-gray-100 rounded-xl items-center justify-center">
            <View className="flex-row items-center">
              <Ionicons name="phone-portrait-outline" size={18} />
              <Text className="ml-2 text-gray-600">PDA App preview</Text>
            </View>
          </View>
        </Card>

        {/* Highlights */}
        <View className="mt-8 space-y-3">
          <Text className="text-lg font-semibold">Tính năng nổi bật</Text>
          <View className="flex-row gap-4">
            <View className="flex-1 items-center space-y-2">
              <Ionicons name="analytics-outline" size={22} />
              <Text className="text-center text-sm text-gray-700">
                Phân tích dòng tiền & báo cáo
              </Text>
            </View>
            <View className="flex-1 items-center space-y-2">
              <Ionicons name="qr-code-outline" size={22} />
              <Text className="text-center text-sm text-gray-700">
                Truy xuất nguồn gốc
              </Text>
            </View>
            <View className="flex-1 items-center space-y-2">
              <Ionicons name="chatbubble-ellipses-outline" size={22} />
              <Text className="text-center text-sm text-gray-700">
                Tư vấn kỹ thuật AI
              </Text>
            </View>
          </View>
        </View>

        {/* CTA cuối */}
        <View className="mt-10 items-center space-y-3">
          <Text className="text-sm text-gray-600">
            Sẵn sàng bắt đầu canh tác thông minh?
          </Text>
          <View className="w-full">
            <TWButton
              title="Tạo tài khoản"
              leftIcon="sparkles-outline"
              onPress={() => router.push("/(auth)/register" as Href)}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
