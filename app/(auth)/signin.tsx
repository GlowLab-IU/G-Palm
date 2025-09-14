// app/(auth)/signin.tsx
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

export default function Signin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);

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
            <Text className="text-base font-semibold">Sign In</Text>
            <View className="w-10" />
          </View>

          {/* Logo + welcome */}
          <View className="items-center mt-2">
            <View className="w-20 h-20 rounded-2xl border border-gray-300 items-center justify-center">
              {/* Thay bằng <Image source={...}/> nếu có logo */}
              <Text className="text-gray-500">LOGO</Text>
            </View>
            <Text className="mt-6 text-3xl font-extrabold">Welcome Back</Text>
            <Text className="mt-2 text-gray-500">Sign in to your account</Text>
          </View>

          {/* Email */}
          <View className="mt-10">
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
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secure}
                autoCapitalize="none"
                autoComplete="password"
              />
              <Pressable
                onPress={() => setSecure((s) => !s)}
                className="px-3 h-12 items-center justify-center"
              >
                <Ionicons
                  name={secure ? "eye-off-outline" : "eye-outline"}
                  size={22}
                />
              </Pressable>
            </View>
          </View>

          {/* Forgot password */}
          <View className="items-end mt-2">
            <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
              <Text className="text-gray-600 underline">Forgot Password?</Text>
            </Pressable>
          </View>

          {/* Primary button */}
          <Pressable
            onPress={() => {
              /* TODO: call sign-in API */
            }}
            className="mt-6 h-14 rounded-full bg-neutral-900 items-center justify-center"
          >
            <Text className="text-white text-lg font-semibold">Sign In</Text>
          </Pressable>

          {/* OR divider */}
          <View className="my-6 flex-row items-center">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-4 text-gray-500">OR</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* Social buttons */}
          <Pressable
            onPress={() => {
              /* TODO: Google sign-in */
            }}
            className="h-14 rounded-full border border-gray-300 flex-row items-center px-4"
          >
            <View className="w-9 h-9 rounded-full border border-gray-300 items-center justify-center mr-3">
              <Text className="font-medium">G</Text>
            </View>
            <Text className="text-base">Continue with Google</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              /* TODO: Apple sign-in */
            }}
            className="h-14 rounded-full border border-gray-300 flex-row items-center px-4 mt-3"
          >
            <View className="w-9 h-9 rounded-md border border-gray-300 items-center justify-center mr-3">
              <Ionicons name="logo-apple" size={18} />
            </View>
            <Text className="text-base">Continue with Apple</Text>
          </Pressable>

          {/* Footer link */}
          <View className="items-center mt-10">
            <Text className="text-gray-600">
              Don`t have an account?{" "}
              <Link href="/(auth)/signup" className="underline font-semibold">
                Sign Up
              </Link>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
