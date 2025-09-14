import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Welcome() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand */}
        <View className="mt-4 flex-row items-center">
          <View className="w-12 h-12 rounded-md border border-gray-300 items-center justify-center mr-3">
            <Text className="text-gray-500">LOGO</Text>
          </View>
          <View>
            <Text className="text-xl font-extrabold">AI Physiognomy</Text>
            <Text className="text-gray-500 -mt-0.5">Face Analysis</Text>
          </View>
        </View>

        {/* Hero copy */}
        <View className="mt-10 border border-dashed border-gray-300 rounded-xl p-6">
          <Text className="text-4xl leading-tight font-extrabold mb-4">
            Discover What{"\n"}Your Face Reveals
          </Text>
          <Text className="text-gray-600">
            Advanced AI analysis reveals personality traits through your facial
            features and palm lines.
          </Text>
        </View>

        {/* Google */}
        <Pressable
          onPress={() => {
            // TODO: Google OAuth
          }}
          className="mt-10 h-16 rounded-full bg-neutral-900 flex-row items-center px-4"
        >
          <View className="w-10 h-10 rounded-full border border-gray-400 items-center justify-center mr-3">
            <Text className="text-white font-semibold">G</Text>
          </View>
          <Text className="text-white text-lg font-semibold">
            Continue with Google
          </Text>
        </Pressable>

        {/* Apple */}
        <Pressable
          onPress={() => {
            // TODO: Apple Sign In
          }}
          className="mt-4 h-16 rounded-full border-2 border-gray-800 flex-row items-center px-4"
        >
          <View className="w-10 h-10 rounded-md border border-gray-400 items-center justify-center mr-3">
            <Ionicons name="logo-apple" size={18} />
          </View>
          <Text className="text-lg font-semibold">Continue with Apple</Text>
        </Pressable>

        {/* Divider */}
        <View className="my-6 items-center">
          <Text className="text-gray-500">or continue to</Text>
        </View>

        {/* Login button (ghost) */}
        <Pressable
          onPress={() => router.push("/signin")}
          className="h-16 rounded-full border border-gray-300 bg-gray-100/40 items-center justify-center"
        >
          <Text className="text-gray-600 text-lg">Login to your account</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(tabs)/home")}
          className="h-16 rounded-full border border-gray-300 bg-gray-100/40 items-center justify-center"
        >
          <Text className="text-gray-600 text-lg"></Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
