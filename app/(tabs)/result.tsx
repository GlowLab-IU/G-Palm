import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_URL = "https://91tnmr9n-8000.asse.devtunnels.ms/predict";

const wxIcon = (code: number) => {
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
  temperature?: number;
  humidity?: number;
  apparent?: number;
  precipitation?: number;
  windspeed?: number;
  winddirection?: number;
  cloudcover?: number;
  code?: number;
};

export default function ResultPage() {
  const router = useRouter();
  const { uri, area_m2, area_ha, center, polygon } = useLocalSearchParams<{
    uri?: string;
    area_m2?: string;
    area_ha?: string;
    center?: string;
    polygon?: string;
  }>();

  const areaSqm = area_m2 ? Number(area_m2) : undefined;
  const areaHa = area_ha ? Number(area_ha) : undefined;
  const centerLL = center
    ? (JSON.parse(center) as { latitude: number; longitude: number })
    : undefined;
  const polygonPoints = polygon ? JSON.parse(polygon) : undefined;
  const rawUri = typeof uri === "string" ? uri : undefined;
  const decodedUri = useMemo(() => {
    if (!rawUri || rawUri === "") return undefined;
    if (rawUri.startsWith("file://")) return rawUri;
    try {
      const u = decodeURIComponent(rawUri);
      return u.startsWith("file://") ? u : rawUri;
    } catch {
      return rawUri;
    }
  }, [rawUri]);

  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [density, setDensity] = useState<number | null>(null);
  const [overlayJpeg, setOverlayJpeg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [wxErr, setWxErr] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!centerLL) return;
      try {
        setWxErr(null);
        const q = `https://api.open-meteo.com/v1/forecast?latitude=${centerLL.latitude}&longitude=${centerLL.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,cloud_cover,weather_code&timezone=auto`;
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
    if (centerLL) run();
  }, [center, centerLL]);

  const sendToAI = async () => {
    if (!polygonPoints || !centerLL) {
      setErr("Invalid polygon or center data.");
      return;
    }
    setLoading(true);
    setErr(null);
    setCount(null);
    setDensity(null);
    setOverlayJpeg(null);
    try {
      const body = {
        polygon: polygonPoints,
        center: centerLL,
        area_m2: areaSqm,
        area_ha: areaHa,
      };
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} - ${await res.text()}`);

      const json = await res.json();
      const c =
        typeof json?.predicted_count === "number" ? json.predicted_count : null;
      setCount(c);
      setOverlayJpeg(
        typeof json?.overlay_image_base64 === "string"
          ? json.overlay_image_base64
          : null
      );
      if (c != null && areaHa && areaHa > 0) setDensity(c / areaHa);
    } catch (e: any) {
      setErr(e?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (polygonPoints) {
      sendToAI();
    }
  }, [polygon]);

  const centerIcon = (
    <Ionicons
      name="location"
      size={18}
      color="#60a5fa"
      style={{ marginRight: 6 }}
    />
  );
  const areaIcon = (
    <MaterialCommunityIcons
      name="map-legend"
      size={18}
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.title}>Analysis Result</Text>

        <Text style={styles.imageSectionTitle}>Selected Area Snapshot</Text>
        <View style={styles.imageContainer}>
          {decodedUri ? (
            <Image
              source={{ uri: decodedUri }}
              style={styles.image}
              resizeMode="contain"
              onError={(e) => {
                console.warn(
                  "Error loading snapshot image:",
                  e.nativeEvent.error
                );
                setErr("Error loading preview image.");
              }}
            />
          ) : (
            <ActivityIndicator color="#bbb" />
          )}
        </View>

        {(centerLL || areaSqm != null) && (
          <View style={styles.metadataBox}>
            {centerLL && (
              <View style={styles.rowCenter}>
                {centerIcon}
                <Text
                  style={styles.metadataText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Center: {centerLL.latitude.toFixed(6)},{" "}
                  {centerLL.longitude.toFixed(6)}
                </Text>
              </View>
            )}
            {areaSqm != null && (
              <View style={styles.rowCenter}>
                {areaIcon}
                <Text
                  style={styles.metadataText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Area: {areaSqm.toLocaleString()} m² ({areaHa?.toFixed(2)} ha)
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.weatherBox}>
          <View style={styles.rowCenter}>
            <MaterialCommunityIcons
              name={wxPack.name as any}
              size={24}
              color="#93c5fd"
            />
            <Text style={styles.weatherTitle}>Current Weather</Text>
          </View>
          {wxErr ? (
            <Text style={styles.errorTextSmall}>{wxErr}</Text>
          ) : wx ? (
            <View style={styles.weatherDetails}>
              <View style={styles.rowCenter}>
                <MaterialCommunityIcons
                  name="thermometer"
                  size={20}
                  color="#fca5a5"
                />
                <Text style={styles.weatherText}>
                  {wx.temperature?.toFixed(1)}°C
                </Text>
              </View>
              {wx.apparent != null && (
                <View style={styles.rowCenter}>
                  <MaterialCommunityIcons
                    name="thermometer-lines"
                    size={20}
                    color="#fda4af"
                  />
                  <Text style={styles.weatherText}>
                    Feels like {wx.apparent.toFixed(1)}°C
                  </Text>
                </View>
              )}
              {wx.humidity != null && (
                <View style={styles.rowCenter}>
                  <MaterialCommunityIcons
                    name="water-percent"
                    size={20}
                    color="#86efac"
                  />
                  <Text style={styles.weatherText}>{wx.humidity}% RH</Text>
                </View>
              )}
            </View>
          ) : (
            <ActivityIndicator color="#93c5fd" />
          )}
        </View>

        <View style={styles.buttonRow}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.button, styles.buttonBack]}
          >
            <Text style={styles.buttonText}>Back to Map</Text>
          </Pressable>
          <Pressable
            disabled={loading || !polygonPoints}
            onPress={sendToAI}
            style={[
              styles.button,
              loading || !polygonPoints
                ? styles.buttonDisabled
                : styles.buttonSubmit,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonSubmitText}>Re-analyze</Text>
            )}
          </Pressable>
        </View>

        {err && !loading && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Error: {err}</Text>
          </View>
        )}
        {count != null && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>AI Result</Text>
            <Text style={styles.resultCount}>{count.toFixed(0)} trees</Text>
            {density != null && (
              <Text style={styles.resultDensity}>
                Density: {density.toFixed(1)} trees/ha
              </Text>
            )}
          </View>
        )}

        {overlayJpeg && !loading && (
          <>
            <Text style={styles.imageSectionTitle}>Prediction Overlay</Text>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: `data:image/jpeg;base64,${overlayJpeg}` }}
                style={styles.image}
                resizeMode="contain"
                onError={(e) => {
                  console.warn(
                    "Error loading overlay image:",
                    e.nativeEvent.error
                  );
                }}
              />
            </View>
          </>
        )}
        {loading && (
          <View style={styles.imageContainer}>
            <ActivityIndicator color="#bbb" size="large" />
            <Text style={[styles.noImageText, { marginTop: 16 }]}>
              Waiting for server result...
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0b0b0b" },
  scrollViewContent: { padding: 20, gap: 20, paddingBottom: 40 },
  title: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 12,
  },
  imageSectionTitle: {
    color: "#a1a1aa",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  imageContainer: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 250,
  },
  image: { width: "100%", aspectRatio: 1, borderRadius: 12 },
  noImageText: { color: "#9ca3af", fontSize: 16, marginTop: 8 },
  metadataBox: {
    backgroundColor: "#0b1220",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1f2a44",
    gap: 12,
  },
  rowCenter: { flexDirection: "row", alignItems: "center" },
  metadataText: {
    color: "#e0e7ff",
    marginLeft: 8,
    flexShrink: 1,
    fontSize: 15,
  },
  weatherBox: {
    backgroundColor: "#09111c",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#10243e",
    gap: 12,
  },
  weatherTitle: {
    color: "#bfdbfe",
    fontWeight: "700",
    marginLeft: 10,
    fontSize: 18,
  },
  weatherDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 4,
  },
  weatherText: { color: "#f3f4f6", marginLeft: 6, fontSize: 16 },
  errorTextSmall: { color: "#fecaca", fontSize: 14 },
  buttonRow: { flexDirection: "row", gap: 16 },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonBack: { backgroundColor: "#374151" },
  buttonSubmit: { backgroundColor: "#16a34a" },
  buttonDisabled: { backgroundColor: "#4b5563" },
  buttonText: { color: "#ffffff", fontWeight: "600", fontSize: 16 },
  buttonSubmitText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  errorBox: {
    backgroundColor: "#451a1a",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#7f1d1d",
  },
  errorText: { color: "#fecaca", fontSize: 16, lineHeight: 22 },
  resultBox: {
    backgroundColor: "#062a11",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#14532d",
    gap: 8,
    alignItems: "center",
  },
  resultTitle: {
    color: "#a7f3d0",
    fontSize: 18,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  resultCount: {
    color: "#ffffff",
    fontSize: 40,
    fontWeight: "800",
    marginVertical: 8,
  },
  resultDensity: { color: "#d1fae5", fontSize: 18 },
});
