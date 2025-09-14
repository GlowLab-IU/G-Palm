import { Slot, Stack } from "expo-router";
import "./global.css";
import { NativeBaseProvider } from "native-base";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <NativeBaseProvider>
      <SafeAreaProvider>
        <Slot />
      </SafeAreaProvider>
    </NativeBaseProvider>
  );
}
