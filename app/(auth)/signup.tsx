// app/(auth)/signup.tsx
import Ionicons from "@expo/vector-icons/Ionicons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Signup() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [secure1, setSecure1] = useState(true);
  const [secure2, setSecure2] = useState(true);
  const [agree, setAgree] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top bar */}
          <View className="mt-2 mb-3 flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full border border-gray-300 items-center justify-center"
            >
              <Ionicons name="chevron-back" size={20} />
            </Pressable>
            <Text className="text-base font-semibold">Sign Up</Text>
            <View className="w-10" />
          </View>

          {/* Logo + title */}
          <View className="items-center mt-2">
            <View className="w-20 h-20 rounded-2xl border border-gray-300 items-center justify-center">
              <Text className="text-gray-500">LOGO</Text>
            </View>
            <Text className="mt-6 text-3xl font-extrabold">Create Account</Text>
            <Text className="mt-2 text-gray-500">Join us to get started</Text>
          </View>

          {/* Full name */}
          <View className="mt-10">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Full Name
            </Text>
            <View className="rounded-2xl border border-gray-300">
              <TextInput
                className="px-4 py-3.5 text-base"
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          </View>

          {/* Email */}
          <View className="mt-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Email
            </Text>
            <View className="rounded-2xl border border-gray-300">
              <TextInput
                className="px-4 py-3.5 text-base"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </View>

          {/* Password */}
          <View className="mt-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Password
            </Text>
            <View className="rounded-2xl border border-gray-300 flex-row items-center">
              <TextInput
                className="flex-1 px-4 py-3.5 text-base"
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secure1}
                autoCapitalize="none"
                autoComplete="password-new"
              />
              <Pressable
                onPress={() => setSecure1((s) => !s)}
                className="px-3 h-12 items-center justify-center"
              >
                <Ionicons
                  name={secure1 ? "eye-off-outline" : "eye-outline"}
                  size={22}
                />
              </Pressable>
            </View>
          </View>

          {/* Confirm Password */}
          <View className="mt-5">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </Text>
            <View className="rounded-2xl border border-gray-300 flex-row items-center">
              <TextInput
                className="flex-1 px-4 py-3.5 text-base"
                placeholder="Confirm your password"
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={secure2}
                autoCapitalize="none"
                autoComplete="password-new"
              />
              <Pressable
                onPress={() => setSecure2((s) => !s)}
                className="px-3 h-12 items-center justify-center"
              >
                <Ionicons
                  name={secure2 ? "eye-off-outline" : "eye-outline"}
                  size={22}
                />
              </Pressable>
            </View>
          </View>

          {/* Terms */}
          <View className="mt-5 flex-row items-start">
            <Pressable
              onPress={() => setAgree((v) => !v)}
              className="w-5 h-5 rounded-[4px] border border-gray-400 items-center justify-center mr-3"
            >
              {agree ? <Ionicons name="checkmark" size={16} /> : null}
            </Pressable>
            <Text className="flex-1 text-gray-700">
              I agree to the{" "}
              <Link href="/(policy)/terms" className="underline">
                Terms &amp; Conditions
              </Link>{" "}
              and{" "}
              <Link href="/(policy)/privacy" className="underline">
                Privacy Policy
              </Link>
            </Text>
          </View>

          {/* Primary button */}
          <Pressable
            onPress={() => {
              if (!agree) return;
              // TODO: call sign-up API
            }}
            className={`mt-6 h-14 rounded-full items-center justify-center ${
              agree ? "bg-neutral-900" : "bg-gray-300"
            }`}
          >
            <Text className="text-white text-lg font-semibold">
              Create Account
            </Text>
          </Pressable>

          {/* Divider */}
          <View className="my-6 flex-row items-center">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-4 text-gray-500">OR</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* Social buttons */}
          <View className="flex-row">
            <Pressable
              onPress={() => {}}
              className="flex-1 h-14 rounded-full border border-gray-300 flex-row items-center px-4 mr-3"
            >
              <View className="w-9 h-9 rounded-full border border-gray-300 items-center justify-center mr-3">
                <Text className="font-medium">G</Text>
              </View>
              <Text className="text-base">Google</Text>
            </Pressable>
            <Pressable
              onPress={() => {}}
              className="flex-1 h-14 rounded-full border border-gray-300 flex-row items-center px-4"
            >
              <View className="w-9 h-9 rounded-md border border-gray-300 items-center justify-center mr-3">
                <Ionicons name="logo-apple" size={18} />
              </View>
              <Text className="text-base">Apple</Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View className="items-center mt-8">
            <Text className="text-gray-600">
              Already have an account?{" "}
              <Link href="/signin" className="underline font-semibold">
                Sign In
              </Link>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
