import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Href, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://mako-fast-bobcat.ngrok-free.app/predict";

// map weathercode -> icon + text
const wxIcon = (code: number) => {
  // nhóm theo https://open-meteo.com/ docs
  if ([0].includes(code)) return { name: "weather-sunny", label: "Clear" };
  if ([1, 2].includes(code))
    return { name: "weather-partly-cloudy", label: "Partly cloudy" };
  if ([3].includes(code)) return { name: "weather-cloudy", label: "Cloudy" };
  if ([45, 48].includes(code)) return { name: "weather-fog", label: "Fog" };
  if ([51, 53, 55, 56, 57].includes(code))
    return { name: "weather-rainy", label: "Drizzle" };
  if ([61, 63, 65, 80, 81, 82].includes(code))
    return { name: "weather-pouring", label: "Rain" };
  if ([66, 67, 71, 73, 75, 77, 85, 86].includes(code))
    return { name: "weather-snowy", label: "Snow" };
  if ([95, 96, 99].includes(code))
    return { name: "weather-lightning", label: "Thunderstorm" };
  return { name: "weather-cloudy", label: "Weather" };
};

type Weather = {
  temperature?: number; // °C
  humidity?: number; // %
  apparent?: number; // °C
  precipitation?: number; // mm
  windspeed?: number; // km/h
  winddirection?: number; // °
  cloudcover?: number; // %
  code?: number;
};

export default function ResultPage() {
  const router = useRouter();
  const { uri, area_m2, area_ha, center } = useLocalSearchParams<{
    uri?: string;
    area_m2?: string;
    area_ha?: string;
    center?: string;
  }>();

  const areaSqm = area_m2 ? Number(area_m2) : undefined;
  const areaHa = area_ha ? Number(area_ha) : undefined;
  const centerLL = center
    ? (JSON.parse(center) as { latitude: number; longitude: number })
    : undefined;

  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [density, setDensity] = useState<number | null>(null);
  const [overlayJpeg, setOverlayJpeg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [weather, setWeather] = useState<Weather | null>(null);
  const [wxErr, setWxErr] = useState<string | null>(null);

  // fetch thời tiết tại tâm
  useEffect(() => {
    const run = async () => {
      if (!centerLL) return;
      try {
        setWxErr(null);
        // Open-Meteo current fields
        const q =
          `https://api.open-meteo.com/v1/forecast?latitude=${centerLL.latitude}` +
          `&longitude=${centerLL.longitude}` +
          `&current=temperature_2m,relative_humidity_2m,apparent_temperature,` +
          `precipitation,wind_speed_10m,wind_direction_10m,cloud_cover,weather_code` +
          `&timezone=auto`;
        const r = await fetch(q);
        const j = await r.json();
        const c = j?.current || {};
        setWeather({
          temperature: c.temperature_2m,
          humidity: c.relative_humidity_2m,
          apparent: c.apparent_temperature,
          precipitation: c.precipitation,
          windspeed: c.wind_speed_10m,
          winddirection: c.wind_direction_10m,
          cloudcover: c.cloud_cover,
          code: c.weather_code,
        });
      } catch (e: any) {
        setWxErr(e?.message || "Weather fetch failed");
      }
    };
    run();
  }, [center]);

  const sendToAI = async () => {
    if (!uri) return;
    setLoading(true);
    setErr(null);
    setCount(null);
    setOverlayJpeg(null);
    try {
      const form = new FormData();
      if (Platform.OS === "web") {
        const blob = await fetch(uri).then((r) => r.blob());
        form.append(
          "file",
          new File([blob], "parcel.png", { type: "image/png" })
        );
      } else {
        form.append("file", {
          uri,
          name: "parcel.png",
          type: "image/png",
        } as any);
      }
      const res = await fetch(API_URL, { method: "POST", body: form });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const c =
        typeof json?.predicted_count === "number" ? json.predicted_count : null;
      setCount(c);
      setOverlayJpeg(
        typeof json?.image_base64 === "string" ? json.image_base64 : null
      );
      if (c != null && areaHa && areaHa > 0) setDensity(c / areaHa);
    } catch (e: any) {
      setErr(e?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    sendToAI();
  }, [uri]);

  const centerIcon = (
    <Ionicons
      name="location"
      size={16}
      color="#60a5fa"
      style={{ marginRight: 6 }}
    />
  );
  const areaIcon = (
    <MaterialCommunityIcons
      name="map-legend"
      size={16}
      color="#34d399"
      style={{ marginRight: 6 }}
    />
  );

  const wx = weather;
  const wxPack =
    wx?.code != null
      ? wxIcon(wx.code)
      : { name: "weather-cloudy", label: "Weather" };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b0b0b" }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
          Your land parcel
        </Text>

        {/* Ảnh kết quả đã crop/mask */}
        <View
          style={{
            backgroundColor: "#111827",
            borderRadius: 12,
            padding: 12,
            alignItems: "center",
          }}
        >
          {uri ? (
            <Image
              source={{ uri }}
              style={{ width: "100%", aspectRatio: 1, borderRadius: 12 }}
              resizeMode="contain"
            />
          ) : (
            <Text style={{ color: "#bbb" }}>No image available</Text>
          )}
        </View>

        {/* Meta: tâm + diện tích */}
        {(centerLL || areaSqm) && (
          <View
            style={{
              backgroundColor: "#0b1220",
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: "#1f2a44",
              gap: 6,
            }}
          >
            {centerLL && (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {centerIcon}
                <Text style={{ color: "#c7d2fe" }}>
                  Center: {centerLL.latitude.toFixed(6)},{" "}
                  {centerLL.longitude.toFixed(6)}
                </Text>
              </View>
            )}
            {areaSqm != null && (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {areaIcon}
                <Text style={{ color: "#bbf7d0" }}>
                  Area: {areaSqm.toLocaleString()} m² ({areaHa?.toFixed(2)} ha)
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Thời tiết hiện tại tại tâm */}
        <View
          style={{
            backgroundColor: "#09111c",
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: "#10243e",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <MaterialCommunityIcons
              name={wxPack.name as any}
              size={22}
              color="#93c5fd"
            />
            <Text
              style={{ color: "#93c5fd", fontWeight: "700", marginLeft: 8 }}
            >
              Weather now
            </Text>
          </View>
          {wxErr ? (
            <Text style={{ color: "#fecaca" }}>Weather: {wxErr}</Text>
          ) : wx ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <MaterialCommunityIcons
                  name="thermometer"
                  size={18}
                  color="#fca5a5"
                />
                <Text style={{ color: "#fff" }}>
                  {wx.temperature?.toFixed(1)}°C
                </Text>
              </View>
              {wx.apparent != null && (
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <MaterialCommunityIcons
                    name="thermometer-lines"
                    size={18}
                    color="#fda4af"
                  />
                  <Text style={{ color: "#e5e7eb" }}>
                    Feels {wx.apparent.toFixed(1)}°C
                  </Text>
                </View>
              )}
              {wx.humidity != null && (
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <MaterialCommunityIcons
                    name="water-percent"
                    size={18}
                    color="#86efac"
                  />
                  <Text style={{ color: "#e5e7eb" }}>{wx.humidity}% RH</Text>
                </View>
              )}
              {wx.cloudcover != null && (
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <MaterialCommunityIcons
                    name="weather-cloudy"
                    size={18}
                    color="#a7f3d0"
                  />
                  <Text style={{ color: "#e5e7eb" }}>
                    {wx.cloudcover}% clouds
                  </Text>
                </View>
              )}
              {wx.precipitation != null && (
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <MaterialCommunityIcons
                    name="weather-pouring"
                    size={18}
                    color="#93c5fd"
                  />
                  <Text style={{ color: "#e5e7eb" }}>
                    {wx.precipitation} mm
                  </Text>
                </View>
              )}
              {wx.windspeed != null && (
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <MaterialCommunityIcons
                    name="weather-windy"
                    size={18}
                    color="#60a5fa"
                  />
                  <Text style={{ color: "#e5e7eb" }}>{wx.windspeed} km/h</Text>
                </View>
              )}
              {wx.winddirection != null && (
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <MaterialCommunityIcons
                    name="navigation-variant"
                    size={18}
                    color="#fde68a"
                  />
                  <Text style={{ color: "#e5e7eb" }}>{wx.winddirection}°</Text>
                </View>
              )}
            </View>
          ) : (
            <ActivityIndicator color="#93c5fd" />
          )}
        </View>

        {/* Nút */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={() => router.push("/(tabs)/maps" as Href)}
            style={{
              flex: 1,
              backgroundColor: "#374151",
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              Back to map
            </Text>
          </Pressable>

          <Pressable
            disabled={loading || !uri}
            onPress={sendToAI}
            style={{
              flex: 1,
              backgroundColor: loading || !uri ? "#4b5563" : "#16a34a",
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "700" }}>
                Submit analysis
              </Text>
            )}
          </Pressable>
        </View>

        {/* Kết quả AI */}
        {err && (
          <View
            style={{
              backgroundColor: "#451a1a",
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: "#7f1d1d",
            }}
          >
            <Text style={{ color: "#fecaca" }}>Error: {err}</Text>
          </View>
        )}
        {count != null && (
          <View
            style={{
              backgroundColor: "#112615",
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: "#14532d",
              gap: 6,
            }}
          >
            <Text style={{ color: "#6ee7b7", fontSize: 14 }}>AI result</Text>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
              {count.toFixed(0)} trees
            </Text>
            {density != null && (
              <Text style={{ color: "#d1fae5" }}>
                Density: {density.toFixed(1)} trees/ha
              </Text>
            )}
          </View>
        )}

        {/* Overlay từ server */}
        {overlayJpeg && (
          <View
            style={{
              backgroundColor: "#1f2937",
              borderRadius: 12,
              padding: 12,
              gap: 8,
            }}
          >
            <Text style={{ color: "#9ca3af" }}>Compressed overlay (JPEG)</Text>
            <Image
              source={{ uri: `data:image/jpeg;base64,${overlayJpeg}` }}
              style={{ width: "100%", aspectRatio: 1, borderRadius: 12 }}
              resizeMode="contain"
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
