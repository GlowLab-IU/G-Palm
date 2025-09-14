import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Trait = { title: string; desc: string; score: number; color?: string };

function TraitRow({ t }: { t: Trait }) {
  return (
    <View className="mb-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
      <Text className="font-semibold">{t.title}</Text>
      <Text className="text-gray-600 mt-0.5">{t.desc}</Text>
      <View className="mt-2 flex-row items-center">
        <View className="flex-1 h-3 rounded-full bg-gray-200 overflow-hidden mr-3">
          <View
            style={{
              width: `${t.score}%`,
              height: "100%",
              backgroundColor: t.color || "#16a34a",
              borderRadius: 999,
            }}
          />
        </View>
        <Text className="text-gray-700">{t.score}%</Text>
      </View>
    </View>
  );
}

function Pill({ title, value }: { title: string; value: string }) {
  return (
    <View className="flex-1 mr-3 mb-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
      <Text className="text-gray-600 text-xs">{title}</Text>
      <Text className="mt-1 font-medium">{value}</Text>
    </View>
  );
}

const W = Dimensions.get("window").width;
const BOX_W = W - 32;
const CAM_H = BOX_W * 1.25;

export default function ResultPage() {
  const router = useRouter();
  const { uri = "" } = useLocalSearchParams<{ uri?: string }>();

  const traits: Trait[] = useMemo(
    () => [
      {
        title: "Leadership",
        desc: "Strong leadership qualities detected",
        score: 85,
      },
      {
        title: "Creativity",
        desc: "High creative potential indicated",
        score: 72,
        color: "#f59e0b",
      },
      {
        title: "Analytical",
        desc: "Strong analytical thinking patterns",
        score: 90,
      },
    ],
    []
  );

  const shareIt = async () => {
    try {
      await Share.share({
        message: "My AI Face Analysis result",
        url: typeof uri === "string" ? uri : undefined,
      });
    } catch {
      Alert.alert("Share failed");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 pt-1 pb-3 flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full border border-gray-300 items-center justify-center mr-3"
        >
          <Ionicons name="chevron-back" size={20} />
        </Pressable>
        <Text className="text-xl font-semibold">Face Analysis Results</Text>
      </View>

      {/* SCROLLABLE CONTENT */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Preview card */}
        <View className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 mb-5">
          <View className="items-end">
            <View className="px-3 py-1 rounded-full bg-green-600">
              <Text className="text-white text-xs font-semibold">
                High Quality
              </Text>
            </View>
          </View>

          <View
            style={{
              marginBottom: 20,
              marginHorizontal: 16,
              height: CAM_H,
              borderRadius: 16,
              overflow: "hidden",
              position: "relative",
              backgroundColor: "#000",
            }}
          >
            {typeof uri === "string" ? (
              <Image
                source={{ uri }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
              />
            ) : null}
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 24,
                alignSelf: "center",
                width: BOX_W * 0.7,
                height: BOX_W * 1.0,
                borderWidth: 3,
                borderStyle: "dashed",
                borderColor: "rgba(255,255,255,0.9)",
                borderRadius: BOX_W,
              }}
            />
            <Text
              style={{
                position: "absolute",
                alignSelf: "center",
                top: CAM_H / 2 - 10,
                color: "#fff",
                fontWeight: "600",
              }}
            >
              SCANNED FACE
            </Text>
          </View>

          <Text className="text-center text-gray-600">SCANNED FACE</Text>
        </View>

        {/* Analysis Results */}
        <Text className="text-2xl font-extrabold mb-2">Analysis Results</Text>
        <Text className="text-base font-semibold mb-2">Personality Traits</Text>
        {traits.map((t) => (
          <TraitRow key={t.title} t={t} />
        ))}

        {/* Key Features */}
        <Text className="text-base font-semibold mt-2 mb-2">Key Features</Text>
        <View className="flex-row flex-wrap -mr-3">
          <Pill title="Face Shape" value="Oval" />
          <Pill title="Eye Shape" value="Almond" />
          <Pill title="Nose Type" value="Straight" />
          <Pill title="Jawline" value="Defined" />
        </View>

        {/* Overall Score */}
        <View className="mt-3 rounded-2xl border border-gray-300 bg-gray-100 px-4 py-4 items-center">
          <Text className="font-semibold">Overall Analysis Score</Text>
          <Text
            className="text-3xl mt-1 font-extrabold"
            style={{ color: "#16a34a" }}
          >
            82%
          </Text>
        </View>

        {/* Actions */}
        <View className="mt-4 flex-row">
          <Pressable
            onPress={() => Alert.alert("Saved")}
            className="flex-1 h-14 rounded-full bg-black items-center justify-center mr-3"
          >
            <Text className="text-white font-semibold">Save Results</Text>
          </Pressable>
          <Pressable
            onPress={shareIt}
            className="flex-1 h-14 rounded-full border border-gray-300 bg-white items-center justify-center"
          >
            <Text className="font-semibold">Share</Text>
          </Pressable>
        </View>

        <View className="mt-3 flex-row">
          <Pressable
            onPress={() => router.back()}
            className="flex-1 h-12 rounded-full border border-gray-300 bg-white items-center justify-center mr-3"
          >
            <Text>Retake Scan</Text>
          </Pressable>
          <Pressable
            onPress={() => Alert.alert("Coming soon")}
            className="flex-1 h-12 rounded-full border border-gray-300 bg-white items-center justify-center"
          >
            <Text>View Details</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
