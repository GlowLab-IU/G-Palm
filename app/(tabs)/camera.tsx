import Ionicons from "@expo/vector-icons/Ionicons";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const W = Dimensions.get("window").width;
const BOX_W = W - 32;
const CAM_H = BOX_W * 1.25;

export default function FaceCamera() {
  const router = useRouter();
  const camRef = useRef<CameraView | null>(null);
  const [perm, requestPerm] = useCameraPermissions();
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState<CameraType>("front");

  useEffect(() => {
    (async () => {
      if (!perm?.granted) await requestPerm();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, []);

  const capture = async () => {
    try {
      if (!camRef.current || !ready) return;
      const photo = await camRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: Platform.OS === "android",
      });
      if (photo?.uri) {
        router.push({
          pathname: "/(analysis)/result",
          params: { uri: photo.uri, source: "camera" },
        });
      }
    } catch (e: any) {
      Alert.alert("Lỗi chụp ảnh", e?.message ?? "Unknown");
    }
  };

  const pickFromLibrary = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      router.push({
        pathname: "/(analysis)/result",
        params: { uri: res.assets[0].uri, source: "gallery" },
      });
    }
  };

  if (!perm) return null;

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 pt-1 pb-3 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="w-20 h-20 rounded-full border border-white/50 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={28} />
        </Pressable>
        <Text className="text-black text-lg font-semibold">Face Analysis</Text>
        <Pressable
          className="w-20 h-20 rounded-full border border-white/50 items-center justify-center"
          onPress={() => router.push("/(policy)/guide")}
        >
          <Ionicons name="help-circle" size={28} />
        </Pressable>
      </View>
      {!perm.granted ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="mb-3 text-center">
            Cần quyền Camera để hiển thị.
          </Text>
          <Pressable
            onPress={() => requestPerm()}
            className="h-12 px-5 rounded-full bg-black items-center justify-center"
          >
            <Text className="text-white font-semibold">Cho phép Camera</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* CameraView + overlays */}
          <View
            style={{
              height: CAM_H,
              marginHorizontal: 16,
              borderRadius: 16,
              overflow: "hidden",
              position: "relative",
              backgroundColor: "#000",
            }}
          >
            <CameraView
              ref={camRef}
              facing={facing}
              mode="picture"
              onCameraReady={() => setReady(true)}
              style={StyleSheet.absoluteFillObject}
              key={facing}
            />

            {/* Badge hướng dẫn */}
            <View
              style={{
                position: "absolute",
                top: 12,
                alignSelf: "center",
                paddingHorizontal: 14,
                paddingVertical: 8,
                backgroundColor: "rgba(33,33,33,0.85)",
                borderRadius: 999,
              }}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>
                Đặt khuôn mặt vào khung
              </Text>
            </View>

            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 48,
                alignSelf: "center",
                width: BOX_W * 0.7,
                height: BOX_W * 1,
                borderWidth: 3,
                borderStyle: "dashed",
                borderColor: "rgba(255,255,255,0.9)",
                borderRadius: BOX_W,
              }}
            />
          </View>

          {/* Controls */}
          <View className="mt-16 w-full px-10 flex-row items-center justify-between">
            <Pressable
              onPress={pickFromLibrary}
              className="w-16 h-16 rounded-2xl border border-gray-400 items-center justify-center"
            >
              <Ionicons name="images-outline" size={26} />
              <Text className="text-xs mt-1">Gallery</Text>
            </Pressable>

            <Pressable
              onPress={capture}
              disabled={!ready}
              className="w-20 h-20 rounded-full items-center justify-center"
              style={{
                borderWidth: 6,
                borderColor: "#111",
                opacity: ready ? 1 : 0.4,
              }}
            >
              <View className="w-14 h-14 rounded-full bg-black" />
            </Pressable>

            <Pressable
              onPress={() =>
                setFacing((p) => (p === "front" ? "back" : "front"))
              }
              className="w-16 h-16 rounded-2xl border border-gray-400 items-center justify-center"
            >
              <Ionicons name="camera-reverse-outline" size={26} />
              <Text className="text-xs mt-1">Flip</Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
