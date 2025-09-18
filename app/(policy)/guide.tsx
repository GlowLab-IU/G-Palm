// app/(home)/guide.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Step = {
  stepNumber: string;
  title: string;
  description: string;
  imageUrl: string;
};

const steps: Step[] = [
  {
    stepNumber: "1",
    title: "Take a selfie",
    description:
      "Let’s smile confidently! Make sure your full face is in the camera's view.",
    imageUrl:
      "https://res.cloudinary.com/dwljkfseh/image/upload/v1730726946/462565387_468666096227004_4830643068285312997_n_mkipuw.png",
  },
  {
    stepNumber: "2",
    title: "Facial Area Selection",
    description:
      "We will analyze your facial skin area and display it for review. Please ensure this is the region where you'd like the acne diagnostic process to be conducted.",
    imageUrl:
      "https://res.cloudinary.com/dwljkfseh/image/upload/v1730742920/af_b4eazo.png",
  },
  {
    stepNumber: "3",
    title: "Acne Treatment Solutions",
    description:
      "Our specialized intensive treatment targets each acne-causing factor, providing comprehensive information to help you maintain complete skin health.",
    imageUrl:
      "https://res.cloudinary.com/dwljkfseh/image/upload/v1730742462/cbecb0e7484d6bd604487c5bd504e3db_hjqi4q.jpg",
  },
  {
    stepNumber: "4",
    title: "Expert Care for Acne",
    description:
      "Dermatology specialists and acne treatment experts will deliver personalized, advanced treatment sessions tailored to individual skin needs, addressing specific issues like acne, scarring, and skin texture for optimal results.",
    imageUrl:
      "https://res.cloudinary.com/dwljkfseh/image/upload/v1730804496/dotor_qcvkn1.png",
  },
];

function StepCard({ s }: { s: Step }) {
  return (
    <View className="mb-10">
      {/* Step label */}
      <View className="flex-row items-center justify-center mb-3 px-4">
        <View className="flex-1 h-px bg-gray-300" />
        <Text className="mx-3 font-semibold text-gray-600">
          Step {s.stepNumber}
        </Text>
        <View className="flex-1 h-px bg-gray-300" />
      </View>

      {/* Card */}
      <View className="mx-4 rounded-2xl border border-gray-300 bg-white p-4">
        <Image
          source={{ uri: s.imageUrl }}
          className="w-full h-40 rounded-xl mb-3"
          resizeMode="cover"
        />
        <Text className="text-lg font-semibold text-center">{s.title}</Text>
        <Text className="text-gray-600 mt-2 text-center">{s.description}</Text>

        <Pressable className="self-center mt-4 h-10 px-6 rounded-full bg-black items-center justify-center">
          <Text className="text-white font-semibold">View Details</Text>
        </Pressable>
      </View>
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
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title banner */}
        <View className="mx-4 mb-6 rounded-xl bg-gray-100 py-4">
          <Text className="text-center text-2xl font-extrabold">
            User Guide
          </Text>
        </View>

        {steps.map((s) => (
          <StepCard key={s.stepNumber} s={s} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
