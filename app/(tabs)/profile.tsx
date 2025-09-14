// app/(tabs)/profile.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function StatCard({
  value,
  label,
  sub,
}: {
  value: string | number;
  label: string;
  sub?: string;
}) {
  return (
    <View className="flex-1 rounded-2xl border border-gray-200 p-4 mx-1 bg-white">
      <Text className="text-2xl font-extrabold text-center">{value}</Text>
      <Text className="text-center mt-1">{label}</Text>
      {sub ? (
        <Text className="text-center text-gray-500 mt-1">{sub}</Text>
      ) : null}
    </View>
  );
}

function InfoRow({
  title,
  value,
  onPress,
}: {
  title: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between border border-gray-200 rounded-2xl px-4 py-4 bg-white mb-3"
    >
      <View>
        <Text className="text-xs text-gray-500">{title}</Text>
        <Text className="mt-1">{value}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#6b7280" />
    </Pressable>
  );
}

function RecentItem({
  icon,
  title,
  meta,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  meta: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between border border-gray-200 rounded-2xl px-4 py-4 bg-white mb-3"
    >
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-full border border-gray-300 items-center justify-center mr-3">
          <Ionicons name={icon} size={18} color="#111827" />
        </View>
        <View>
          <Text className="font-medium">{title}</Text>
          <Text className="text-gray-500 text-sm mt-0.5">{meta}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#6b7280" />
    </Pressable>
  );
}

export default function ProfilePage() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
      >
        {/* Header */}
        <View className="mt-2 mb-4 flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full border border-gray-300 items-center justify-center mr-3"
          >
            <Ionicons name="chevron-back" size={20} />
          </Pressable>
          <Text className="text-xl font-semibold">Profile</Text>
        </View>

        {/* Avatar + Name */}
        <View className="items-center mb-6">
          <View className="w-28 h-28 rounded-full border-2 border-gray-300 items-center justify-center">
            <Ionicons name="person" size={42} color="#6b7280" />
          </View>
          <Text className="mt-4 text-2xl font-extrabold">John Smith</Text>
          <Text className="text-gray-500 mt-1">Premium Member</Text>
        </View>

        {/* Account Statistics */}
        <Text className="text-lg font-semibold mb-3">Account Statistics</Text>
        <View className="flex-row -mx-1 mb-6">
          <StatCard value={24} label="Total Scans" sub="This month: 8" />
          <StatCard value={18} label="Analyses" sub="Completed" />
          <StatCard value={"87%"} label="Avg Score" sub="Accuracy" />
        </View>

        {/* Personal Information */}
        <Text className="text-lg font-semibold mb-3">Personal Information</Text>
        <InfoRow
          title="Email"
          value="john.smith@email.com"
          onPress={() => {}}
        />
        <InfoRow title="Phone" value="+1 (555) 123-4567" onPress={() => {}} />
        <InfoRow
          title="Date of Birth"
          value="March 15, 1990"
          onPress={() => {}}
        />

        {/* Recent Analysis */}
        <View className="mt-4 mb-2 flex-row items-center justify-between">
          <Text className="text-lg font-semibold">Recent Analysis</Text>
          <Pressable onPress={() => {}}>
            <Text className="text-gray-600 underline">View All</Text>
          </Pressable>
        </View>
        <RecentItem
          icon="happy-outline"
          title="Face Analysis"
          meta="Score: 89% • 2 hours ago"
          onPress={() => {}}
        />
        <RecentItem
          icon="hand-left-outline"
          title="Palm Reading"
          meta="Score: 85% • Yesterday"
          onPress={() => {}}
        />

        {/* Quick Settings */}
        <Text className="text-lg font-semibold mt-4 mb-3">Quick Settings</Text>
        <View className="flex-row flex-wrap">
          {["Notifications", "Privacy", "Language"].map((t) => (
            <Pressable
              key={t}
              className="px-5 h-12 rounded-full border border-gray-300 items-center justify-center mr-3 mb-3"
              onPress={() => {}}
            >
              <Text>{t}</Text>
            </Pressable>
          ))}
        </View>

        {/* Actions */}
        <View className="mt-4 flex-row">
          <Pressable
            onPress={() => router.push("/profile")}
            className="flex-1 h-14 rounded-full bg-neutral-900 items-center justify-center mr-3"
          >
            <Text className="text-white font-semibold">Edit Profile</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              // TODO: logout
            }}
            className="flex-1 h-14 rounded-full border border-gray-300 items-center justify-center bg-white"
          >
            <Text className="font-semibold">Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
