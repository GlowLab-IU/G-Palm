import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Href, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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

// weather icon map
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

type Tile = { z: number; x: number; y: number };
type Bounds = { north: number; south: number; west: number; east: number };
function decodeOctant(qk: string): Tile | null {
  if (!qk) return null;
  let x = 0,
    y = 0;
  const z = qk.length;
  for (let i = 0; i < z; i++) {
    const bit = z - i - 1,
      c = qk[i],
      mask = 1 << bit;
    if (c === "1" || c === "3") x |= mask;
    if (c === "2" || c === "3") y |= mask;
    if (c !== "0" && c !== "1" && c !== "2" && c !== "3") return null;
  }
  return { z, x, y };
}
function tileBounds(t: Tile): Bounds {
  const n = 1 << t.z;
  const lon = (tx: number) => (tx / n) * 360 - 180;
  const lat = (ty: number) => {
    const n2 = Math.PI - (2 * Math.PI * ty) / n;
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n2) - Math.exp(-n2)));
  };
  return {
    west: lon(t.x),
    east: lon(t.x + 1),
    north: lat(t.y),
    south: lat(t.y + 1),
  };
}

export default function ResultPage() {
  const router = useRouter();
  const { uri, area_m2, area_ha, center, octant } = useLocalSearchParams<{
    uri?: string;
    area_m2?: string;
    area_ha?: string;
    center?: string;
    octant?: string;
  }>();

  const rawUri = typeof uri === "string" ? uri : undefined;
  const decodedUri = useMemo(() => {
    if (!rawUri) return undefined;
    try {
      if (rawUri.startsWith("file://") || rawUri.startsWith("data:"))
        return rawUri;

      const u = decodeURIComponent(rawUri);
      return u.startsWith("file://") || u.startsWith("data:") ? u : rawUri;
    } catch {
      return rawUri;
    }
  }, [rawUri]);

  const areaSqm = area_m2 ? Number(area_m2) : undefined;
  const areaHa = area_ha ? Number(area_ha) : undefined;
  const centerLL = center
    ? (JSON.parse(center) as { latitude: number; longitude: number })
    : undefined;

  const tile = useMemo(
    () => (octant ? decodeOctant(String(octant)) : null),
    [octant]
  );
  const bounds = useMemo(() => (tile ? tileBounds(tile) : null), [tile]);

  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [density, setDensity] = useState<number | null>(null);
  const [overlayJpeg, setOverlayJpeg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [weather, setWeather] = useState<Weather | null>(null);
  const [wxErr, setWxErr] = useState<string | null>(null);

  // 2) Thời tiết tại tâm
  useEffect(() => {
    const run = async () => {
      if (!centerLL) return;
      try {
        setWxErr(null);
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

  // 3) Gửi ảnh cho AI
  const sendToAI = async () => {
    if (!decodedUri) return;
    setLoading(true);
    setErr(null);
    setCount(null);
    setOverlayJpeg(null);
    try {
      const form = new FormData();

      if (Platform.OS === "web") {
        const blob = await fetch(decodedUri).then((r) => r.blob());
        form.append(
          "file",
          new File([blob], "parcel.png", { type: "image/png" })
        );
      } else {
        form.append("file", {
          uri: decodedUri,
          name: "parcel.png",
          type: "image/png",
        } as any);
      }

      // optional metadata
      if (octant) form.append("octant", String(octant));
      if (bounds) form.append("octant_bounds", JSON.stringify(bounds));
      if (areaSqm != null) form.append("area_m2", String(areaSqm));
      if (areaHa != null) form.append("area_ha", String(areaHa));
      if (centerLL) {
        form.append("center_lat", String(centerLL.latitude));
        form.append("center_lng", String(centerLL.longitude));
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
    // gọi khi có uri mới
    sendToAI();
  }, [decodedUri]);

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

        {/* Ảnh 1:1 */}
        <View
          style={{
            backgroundColor: "#111827",
            borderRadius: 12,
            padding: 12,
            alignItems: "center",
          }}
        >
          {decodedUri ? (
            <Image
              source={{ uri: decodedUri }}
              style={{ width: "100%", aspectRatio: 1, borderRadius: 12 }}
              resizeMode="contain"
              onError={(e) => {}}
            />
          ) : (
            <Text style={{ color: "#bbb" }}>No image available</Text>
          )}
        </View>

        {(centerLL || areaSqm != null) && (
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

        {(octant || bounds) && (
          <View
            style={{
              backgroundColor: "#0c101a",
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: "#1a2a3f",
              gap: 6,
            }}
          >
            <Text style={{ color: "#93c5fd", fontWeight: "700" }}>
              Tile metadata
            </Text>
            {octant && (
              <Text style={{ color: "#cbd5e1" }}>octant: {String(octant)}</Text>
            )}
            {bounds && (
              <Text style={{ color: "#cbd5e1" }}>
                bounds: N {bounds.north.toFixed(6)} · S{" "}
                {bounds.south.toFixed(6)} · W {bounds.west.toFixed(6)} · E{" "}
                {bounds.east.toFixed(6)}
              </Text>
            )}
          </View>
        )}

        {/* Weather */}
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

        {/* Actions */}
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
            disabled={loading || !decodedUri}
            onPress={sendToAI}
            style={{
              flex: 1,
              backgroundColor: loading || !decodedUri ? "#4b5563" : "#16a34a",
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

        {/* AI result */}
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

        {/* Overlay */}
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
