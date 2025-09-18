import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const W = Dimensions.get("window").width;
const BOX_W = W - 64;

export default function Result() {
  const router = useRouter();
  const { uri, payload } = useLocalSearchParams<{
    uri?: string;
    payload?: string;
  }>();

  // parse API result nếu có, còn chưa thì mock
  const apiData = useMemo(() => {
    try {
      return payload ? JSON.parse(payload as string) : null;
    } catch {
      return null;
    }
  }, [payload]);

  // mock traits nếu chưa có data
  const traits = apiData?.traits || [
    {
      label: "Leadership",
      desc: "Strong leadership qualities detected",
      score: 85,
    },
    {
      label: "Creativity",
      desc: "High creative potential indicated",
      score: 72,
    },
    {
      label: "Analytical",
      desc: "Strong analytical thinking patterns",
      score: 90,
    },
  ];

  const keyFeatures = apiData?.features || {
    faceShape: "Oval",
    eyeShape: "Almond",
    noseType: "Straight",
    jawline: "Defined",
  };

  const overall = apiData?.overallScore ?? 82;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 pt-1 pb-3 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full border border-gray-300 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={20} />
        </Pressable>
        <Text className="text-base font-semibold">Face Analysis Results</Text>
        <View className="w-10" />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image + khung oval */}
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 20,
            borderRadius: 16,
            backgroundColor: "#f8f8f8",
            padding: 16,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: BOX_W * 0.7,
              height: BOX_W * 1.0,
              borderWidth: 2,
              borderStyle: "dashed",
              borderColor: "#999",
              borderRadius: BOX_W,
              overflow: "hidden",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {uri ? (
              <Image
                source={{ uri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <Text className="text-gray-400">SCANNED FACE</Text>
            )}
          </View>

          <View
            style={{
              marginTop: 12,
              paddingHorizontal: 12,
              paddingVertical: 4,
              backgroundColor: "#22c55e",
              borderRadius: 8,
            }}
          >
            <Text className="text-white font-semibold text-sm">
              High Quality
            </Text>
          </View>
        </View>

        {/* Traits */}
        <View className="px-5">
          <Text className="font-bold text-lg mb-3">Analysis Results</Text>
          <Text className="font-semibold mb-2">Personality Traits</Text>

          {traits.map(
            (t: { label: string; desc: string; score: number }, i: number) => (
              <View
                key={i}
                className="bg-white mb-3 p-4 rounded-xl border border-gray-200"
              >
                <View className="flex-row justify-between mb-1">
                  <Text className="font-semibold">{t.label}</Text>
                  <Text className="font-semibold text-gray-700">
                    {t.score}%
                  </Text>
                </View>
                <Text className="text-gray-500 text-sm mb-2">{t.desc}</Text>
                <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <View
                    style={{
                      width: `${t.score}%`,
                      height: "100%",
                      backgroundColor: t.score > 80 ? "#22c55e" : "#f59e0b",
                    }}
                  />
                </View>
              </View>
            )
          )}
        </View>

        {/* Features */}
        <View className="px-5 mt-4">
          <Text className="font-semibold mb-2">Key Features</Text>
          <View className="flex-row flex-wrap gap-3">
            <View className="flex-1 bg-gray-100 p-3 rounded-lg">
              <Text className="text-xs text-gray-500">Face Shape</Text>
              <Text className="font-semibold">{keyFeatures.faceShape}</Text>
            </View>
            <View className="flex-1 bg-gray-100 p-3 rounded-lg">
              <Text className="text-xs text-gray-500">Eye Shape</Text>
              <Text className="font-semibold">{keyFeatures.eyeShape}</Text>
            </View>
            <View className="flex-1 bg-gray-100 p-3 rounded-lg">
              <Text className="text-xs text-gray-500">Nose Type</Text>
              <Text className="font-semibold">{keyFeatures.noseType}</Text>
            </View>
            <View className="flex-1 bg-gray-100 p-3 rounded-lg">
              <Text className="text-xs text-gray-500">Jawline</Text>
              <Text className="font-semibold">{keyFeatures.jawline}</Text>
            </View>
          </View>
        </View>

        {/* Overall */}
        <View
          style={{
            marginTop: 24,
            marginHorizontal: 16,
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#ddd",
            alignItems: "center",
          }}
        >
          <Text className="font-semibold text-gray-600">
            Overall Analysis Score
          </Text>
          <Text className="text-2xl font-bold text-green-600 mt-1">
            {overall}%
          </Text>
        </View>

        {/* Actions */}
        <View className="flex-row justify-around mt-6 px-6">
          <Pressable
            className="flex-1 mr-3 h-12 rounded-full bg-black items-center justify-center"
            onPress={() => {}}
          >
            <Text className="text-white font-semibold">Save Results</Text>
          </Pressable>
          <Pressable
            className="flex-1 h-12 rounded-full border border-gray-300 items-center justify-center"
            onPress={() => {}}
          >
            <Text className="font-semibold">Share</Text>
          </Pressable>
        </View>

        <View className="flex-row justify-around mt-4 px-6">
          <Pressable
            className="flex-1 mr-3 h-12 rounded-full border border-gray-300 items-center justify-center"
            onPress={() => router.back()}
          >
            <Text className="font-semibold">Retake Scan</Text>
          </Pressable>
          <Pressable
            className="flex-1 h-12 rounded-full border border-gray-300 items-center justify-center"
            onPress={() => {}}
          >
            <Text className="font-semibold">View Details</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
