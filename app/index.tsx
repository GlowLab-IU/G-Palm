import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Images from "../constants/images";

export default function Welcome() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 32,
          flexGrow: 1,
          rowGap: 16,
        }}
      >
        {/* Brand */}
        <View className="mt-4 flex-row items-center">
          <View className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 items-center justify-center mr-3">
            <Ionicons name="leaf-outline" size={20} color="#A7F3D0" />
          </View>
          <View>
            <Text className="text-white text-xl font-extrabold">
              AI • Palm Tree Counter
            </Text>
            <Text className="text-white/60 -mt-0.5">
              Satellite parcel analysis
            </Text>
          </View>
        </View>

        {/* Hero */}
        <View className="rounded-2xl bg-white/5 border border-white/15 p-6">
          <Text className="text-white text-3xl font-extrabold leading-tight">
            Count palm trees with AI
          </Text>
          <Text className="text-white/70 mt-3">
            Select a parcel on the satellite map, crop the exact boundary, send
            it to AI to estimate tree count and receive a density map.
          </Text>

          {/* Steps */}
          <View className="mt-4 flex-row gap-8">
            <View className="items-center">
              <Text className="text-white/60 text-xs">Step 1</Text>
              <Ionicons name="map-outline" size={26} color="#86efac" />
              <Text className="text-white/80 text-xs mt-1">
                Select boundary
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-white/60 text-xs">Step 2</Text>
              <Ionicons name="crop-outline" size={26} color="#86efac" />
              <Text className="text-white/80 text-xs mt-1">Crop 224×224</Text>
            </View>
            <View className="items-center">
              <Text className="text-white/60 text-xs">Step 3</Text>
              <Ionicons name="sparkles-outline" size={26} color="#86efac" />
              <Text className="text-white/80 text-xs mt-1">Send to AI</Text>
            </View>
          </View>
        </View>

        {/* Features */}
        <View className="gap-3">
          {/* Row 1 */}
          <View className="flex-row gap-3">
            <View className="flex-1 rounded-2xl bg-white/5 border border-white/10 p-4">
              <View className="flex-row items-center gap-2">
                <Ionicons name="earth-outline" size={20} color="#93c5fd" />
                <Text className="text-white font-semibold">
                  Google Satellite Image
                </Text>
              </View>
              <Text className="text-white/70 mt-1 text-sm">
                Satellite map, auto-zoom, polygon marking.
              </Text>
            </View>

            <View className="flex-1 rounded-2xl bg-white/5 border border-white/10 p-4">
              <View className="flex-row items-center gap-2">
                <Ionicons name="resize-outline" size={20} color="#fda4af" />
                <Text className="text-white font-semibold">
                  Crop by boundary • 224×224
                </Text>
              </View>
              <Text className="text-white/70 mt-1 text-sm">
                Mask outside the boundary. Prepare for inference.
              </Text>
            </View>
          </View>

          {/* Row 2 */}
          <View className="flex-row gap-3">
            <View className="flex-1 rounded-2xl bg-white/5 border border-white/10 p-4">
              <View className="flex-row items-center gap-2">
                <Ionicons
                  name="cloud-upload-outline"
                  size={20}
                  color="#86efac"
                />
                <Text className="text-white font-semibold">
                  AI Server Prediction
                </Text>
              </View>
              <Text className="text-white/70 mt-1 text-sm">
                Send the image, receive tree count and density overlay.
              </Text>
            </View>

            <View className="flex-1 rounded-2xl bg-white/5 border border-white/10 p-4">
              <View className="flex-row items-center gap-2">
                <Ionicons name="grid-outline" size={20} color="#fde68a" />
                <Text className="text-white font-semibold">
                  Area calculation
                </Text>
              </View>
              <Text className="text-white/70 mt-1 text-sm">
                Estimate m²/ha using Web Mercator for small parcels.
              </Text>
            </View>
          </View>
        </View>

        {/* Preview */}
        <View className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
          <Image
            source={Images.hero}
            className="w-full h-52"
            resizeMode="cover"
          />
        </View>

        {/* Auth */}
        <Pressable
          onPress={() => {}}
          className="h-14 rounded-full bg-white/90 flex-row items-center px-4"
        >
          <View className="w-9 h-9 rounded-full bg-black/80 items-center justify-center mr-3">
            <Text className="text-white font-semibold">G</Text>
          </View>
          <Text className="text-black text-base font-semibold">
            Continue with Google
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {}}
          className="h-14 rounded-full border border-white/30 flex-row items-center px-4"
        >
          <View className="w-9 h-9 rounded-md bg-white/10 items-center justify-center mr-3">
            <Ionicons name="logo-apple" size={18} color="#fff" />
          </View>
          <Text className="text-white text-base font-semibold">
            Continue with Apple
          </Text>
        </Pressable>

        {/* Divider */}
        <View className="items-center">
          <Text className="text-white/50 text-sm">or</Text>
        </View>

        {/* CTAs */}
        <Pressable
          onPress={() => router.push("/(tabs)/maps")}
          className="h-14 rounded-full bg-green-600 items-center justify-center"
        >
          <Text className="text-white text-base font-semibold">
            Start creating parcels & counting trees
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/signin")}
          className="h-14 rounded-full border border-white/20 items-center justify-center"
        >
          <Text className="text-white/80 text-base">
            Sign in to your account
          </Text>
        </Pressable>

        {/* Footer */}
        <View className="items-center">
          <Text className="text-white/40 text-xs">
            v1 • AI-Palm Tree Counter • © {new Date().getFullYear()}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
