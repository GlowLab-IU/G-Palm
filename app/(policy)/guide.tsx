// app/(home)/guide.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type StepProps = {
  num: number;
  title: string;
  desc: string;
};

function Step({ num, title, desc }: StepProps) {
  return (
    <View className="mb-8">
      <Text className="text-center text-gray-500 mb-2 font-semibold">
        Step {num}
      </Text>
      <View className="flex-row items-center mb-2">
        <View className="w-6 h-6 rounded-full bg-black items-center justify-center mr-2">
          <Text className="text-white text-xs font-bold">{num}</Text>
        </View>
        <Text className="font-semibold">{title}</Text>
      </View>
      <View className="rounded-2xl border border-gray-300 bg-gray-50 px-4 py-10 mb-3 items-center justify-center">
        <Text className="text-gray-400 text-center">{desc}</Text>
      </View>
      <Pressable className="self-center h-10 px-6 rounded-full bg-black items-center justify-center">
        <Text className="text-white font-semibold">View Details</Text>
      </Pressable>
    </View>
  );
}

export default function GuidePage() {
  const router = useRouter();

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
        <Text className="text-lg font-semibold">Guild</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6 py-3 bg-gray-100 rounded-xl">
          <Text className="text-center text-xl font-extrabold">USER GUIDE</Text>
        </View>

        <Step
          num={1}
          title="Take a selfie"
          desc="[SELFIE IMAGE]\nPerson taking selfie with phone camera"
        />
        <Step
          num={2}
          title="Facial Area Selection"
          desc="[FACE ANALYSIS]\nFacial area selection and detection interface"
        />
        <Step
          num={3}
          title="AI Analysis Results"
          desc="[AI ANALYSIS]\nPhysiognomy analysis results and insights"
        />
        <Step
          num={4}
          title="Expert Consultation"
          desc="[EXPERT CONSULTATION]\nProfessional physiognomy expert consultation"
        />
      </ScrollView>
    </SafeAreaView>
  );
}
