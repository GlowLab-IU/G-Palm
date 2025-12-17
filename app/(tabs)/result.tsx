import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// --- CONFIG ---
const API_URL = "https://91tnmr9n-8000.asse.devtunnels.ms/predict";
const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

// --- WEATHER HELPER (GIỮ NGUYÊN TỪ CODE CŨ) ---
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

// --- NEW TYPES FOR AI BACKEND ---
type YieldForecast = {
  min_ton: number;
  max_ton: number;
};

type AgriIntelligence = {
  action: "MAINTAIN" | "PLANT_MORE" | "THINNING";
  message: string;
  yield_forecast_ton: YieldForecast;
  spatial_warnings: string[];
};

type RadiusStats = {
  min_m: number;
  max_m: number;
};

type SummaryStats = {
  count: number;
  area_ha: number;
  density_per_ha: number;
  radius_stats: RadiusStats;
};

type TreeLocation = {
  latitude: number;
  longitude: number;
};

type Tree = {
  id: number;
  location: TreeLocation;
  spacing_status: "CROWDED" | "SPARSE" | "OPTIMAL";
  canopy_area_m2: number;
  canopy_radius_m: number;
};

type APIResponse = {
  summary: SummaryStats;
  agri_intelligence: AgriIntelligence;
  trees: Tree[];
  input_image_base64: string;
  overlay_image_base64: string;
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

  // --- PARSE PARAMS ---
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

  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Weather State
  const [weather, setWeather] = useState<Weather | null>(null);
  const [wxErr, setWxErr] = useState<string | null>(null);

  // AI Data State
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [agriData, setAgriData] = useState<AgriIntelligence | null>(null);
  const [treeList, setTreeList] = useState<Tree[]>([]);
  const [overlayJpeg, setOverlayJpeg] = useState<string | null>(null);

  // UI State
  const [modalVisible, setModalVisible] = useState(false);

  // --- FETCH WEATHER (GIỮ NGUYÊN LOGIC CŨ) ---
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

  // --- SEND TO AI (CẬP NHẬT LOGIC MỚI) ---
  const sendToAI = async () => {
    if (!polygonPoints || !centerLL) {
      setErr("Invalid polygon or center data.");
      return;
    }
    setLoading(true);
    setErr(null);
    setSummary(null);
    setAgriData(null);
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

      const json: APIResponse = await res.json();

      // Map Data
      setSummary(json.summary);
      setAgriData(json.agri_intelligence);
      setTreeList(json.trees || []);
      setOverlayJpeg(json.overlay_image_base64);
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

  // --- UI HELPERS ---
  const wx = weather;
  const wxPack =
    wx?.code != null
      ? wxIcon(wx.code)
      : { name: "weather-cloudy", label: "Weather" };

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

  const renderStatusBadge = (status: string) => {
    let color = "#10b981";
    let bg = "#064e3b";
    if (status === "CROWDED") {
      color = "#ef4444";
      bg = "#450a0a";
    }
    if (status === "SPARSE") {
      color = "#f59e0b";
      bg = "#451a03";
    }
    return (
      <View style={[styles.badge, { backgroundColor: bg, borderColor: color }]}>
        <Text style={[styles.badgeText, { color: color }]}>{status}</Text>
      </View>
    );
  };

  // --- RENDER ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Header & Title */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Pressable
            onPress={() => router.back()}
            style={[
              styles.buttonBack,
              { padding: 8, marginRight: 10, borderRadius: 8 },
            ]}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.title}>Analysis Report</Text>
        </View>

        {/* 1. SNAPSHOT IMAGE (Ảnh chụp màn hình) - Giữ nguyên từ code cũ */}
        <Text style={styles.imageSectionTitle}>1. Input Snapshot</Text>
        <View style={styles.imageContainer}>
          {decodedUri ? (
            <Image
              source={{ uri: decodedUri }}
              style={styles.image}
              resizeMode="cover" // Changed to cover for better look
              onError={(e) => {
                console.warn("Error loading snapshot:", e.nativeEvent.error);
                setErr("Error loading preview image.");
              }}
            />
          ) : (
            <ActivityIndicator color="#bbb" />
          )}
        </View>

        {/* 2. METADATA (Center/Area) - Giữ nguyên từ code cũ */}
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

        {/* 3. WEATHER BOX - Giữ nguyên 100% Logic & Style cũ */}
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
                    Feels {wx.apparent.toFixed(1)}°C
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

        {/* 4. SUMMARY STATS (Dữ liệu mới) */}
        {summary && !loading && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Detection Summary</Text>
            <Text style={styles.resultCount}>{summary.count} Trees</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Density</Text>
                <Text style={styles.statValue}>
                  {summary.density_per_ha.toFixed(1)} /ha
                </Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Avg Radius</Text>
                <Text style={styles.statValue}>
                  {(
                    (summary.radius_stats.min_m + summary.radius_stats.max_m) /
                    2
                  ).toFixed(1)}{" "}
                  m
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* 5. AGRI-INTELLIGENCE (Dữ liệu mới) */}
        {agriData && !loading && (
          <View
            style={[
              styles.agriBox,
              agriData.action === "PLANT_MORE"
                ? styles.borderYellow
                : agriData.action === "THINNING"
                ? styles.borderRed
                : styles.borderGreen,
            ]}
          >
            <View style={styles.rowCenter}>
              <MaterialCommunityIcons name="brain" size={22} color="#e0e7ff" />
              <Text style={styles.agriTitle}>AI Recommendation</Text>
            </View>

            <Text style={styles.recText}>{agriData.message}</Text>

            <View style={styles.divider} />

            <View style={styles.rowCenter}>
              <MaterialCommunityIcons
                name="chart-line"
                size={20}
                color="#a5b4fc"
              />
              <Text style={styles.subTitle}> Yield Forecast (Est.)</Text>
            </View>
            <Text style={styles.yieldVal}>
              {agriData.yield_forecast_ton.min_ton} -{" "}
              {agriData.yield_forecast_ton.max_ton} Tons
            </Text>
          </View>
        )}

        {/* 6. CITATION / WARNING (Dữ liệu mới) */}
        {!loading && (
          <View style={styles.citationBox}>
            <View style={styles.rowCenter}>
              <Ionicons name="information-circle" size={20} color="#fcd34d" />
              <Text style={styles.citationTitle}> Reference Parameters</Text>
            </View>
            <Text style={styles.citationText}>
              Based on Al-Hassa Oasis (Saudi Arabia) standards:
            </Text>
            <Text style={styles.citationBullet}>
              • Density: 100 - 125 trees/ha | Yield: 48 - 85 kg/tree
            </Text>
          </View>
        )}

        {/* 7. OVERLAY IMAGE (Zoomable) */}
        {overlayJpeg && !loading && (
          <>
            <Text style={styles.imageSectionTitle}>
              2. Spatial Analysis Result
            </Text>
            <Text style={styles.hintText}>Tap image to zoom details</Text>

            <Pressable onPress={() => setModalVisible(true)}>
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: `data:image/jpeg;base64,${overlayJpeg}` }}
                  style={styles.image}
                  resizeMode="contain"
                />
                <View style={styles.zoomIconOverlay}>
                  <Ionicons name="expand" size={20} color="white" />
                </View>
              </View>
            </Pressable>
          </>
        )}

        {/* 8. TREE LIST TABLE (Dữ liệu mới) */}
        {treeList.length > 0 && !loading && (
          <View>
            <Text style={styles.imageSectionTitle}>
              Tree Inventory ({treeList.length})
            </Text>
            <View style={styles.table}>
              <View style={styles.tHead}>
                <Text style={[styles.th, { width: 30 }]}>ID</Text>
                <Text style={[styles.th, { flex: 1 }]}>GPS Location</Text>
                <Text style={[styles.th, { width: 70 }]}>Status</Text>
                <Text style={[styles.th, { width: 40, textAlign: "right" }]}>
                  m²
                </Text>
              </View>
              {treeList.slice(0, 50).map((t) => (
                <View key={t.id} style={styles.tRow}>
                  <Text
                    style={[
                      styles.td,
                      { width: 30, fontWeight: "bold", color: "#34d399" },
                    ]}
                  >
                    {t.id}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.gpsText}>
                      {t.location.latitude.toFixed(6)},
                    </Text>
                    <Text style={styles.gpsText}>
                      {t.location.longitude.toFixed(6)}
                    </Text>
                  </View>
                  <View style={{ width: 70 }}>
                    {renderStatusBadge(t.spacing_status)}
                  </View>
                  <Text style={[styles.td, { width: 40, textAlign: "right" }]}>
                    {t.canopy_area_m2.toFixed(0)}
                  </Text>
                </View>
              ))}
            </View>
            {treeList.length > 50 && (
              <Text style={styles.hintText}>Showing first 50 trees...</Text>
            )}
          </View>
        )}

        {/* Loading & Error States */}
        {loading && (
          <View style={styles.imageContainer}>
            <ActivityIndicator color="#34d399" size="large" />
            <Text style={[styles.noImageText, { marginTop: 16 }]}>
              Processing Satellite Imagery...
            </Text>
          </View>
        )}

        {err && !loading && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Error: {err}</Text>
          </View>
        )}

        {/* Buttons */}
        <Pressable
          disabled={loading || !polygonPoints}
          onPress={sendToAI}
          style={[
            styles.button,
            loading ? styles.buttonDisabled : styles.buttonSubmit,
            { marginTop: 10 },
          ]}
        >
          <Text style={styles.buttonSubmitText}>
            {loading ? "Analyzing..." : "Refresh Analysis"}
          </Text>
        </Pressable>
      </ScrollView>

      {/* --- FULL SCREEN ZOOM MODAL --- */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <Pressable
            style={styles.closeBtn}
            onPress={() => setModalVisible(false)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </Pressable>
          <ScrollView
            maximumZoomScale={4}
            minimumZoomScale={1}
            contentContainerStyle={{
              width: SCREEN_WIDTH,
              height: SCREEN_HEIGHT,
            }}
            centerContent={true}
          >
            {overlayJpeg && (
              <Image
                source={{ uri: `data:image/jpeg;base64,${overlayJpeg}` }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />
            )}
          </ScrollView>
          <Text style={styles.modalHint}>Pinch to Zoom</Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#0b0b0b" },
  scrollViewContent: { padding: 20, gap: 20, paddingBottom: 40 },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
  },
  imageSectionTitle: {
    color: "#a1a1aa",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
    marginTop: 10,
  },
  imageContainer: {
    backgroundColor: "#111827",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 250,
    borderWidth: 1,
    borderColor: "#374151",
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
  // Weather Box Styles (Giữ nguyên)
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

  // New Result Box
  resultBox: {
    backgroundColor: "#062a11",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#14532d",
  },
  resultTitle: {
    color: "#a7f3d0",
    fontSize: 16,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  resultCount: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "800",
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: 10,
    borderRadius: 10,
  },
  statCol: { alignItems: "center", flex: 1 },
  statLabel: { color: "#9ca3af", fontSize: 11, textTransform: "uppercase" },
  statValue: { color: "#fff", fontSize: 15, fontWeight: "700", marginTop: 4 },

  // Agri Box
  agriBox: {
    backgroundColor: "#1e1b4b",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  agriTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginLeft: 8 },
  borderGreen: {
    borderColor: "#10b981",
    backgroundColor: "rgba(6, 78, 59, 0.3)",
  },
  borderYellow: {
    borderColor: "#f59e0b",
    backgroundColor: "rgba(69, 26, 3, 0.3)",
  },
  borderRed: {
    borderColor: "#ef4444",
    backgroundColor: "rgba(69, 10, 10, 0.3)",
  },
  recText: { color: "#e0e7ff", fontSize: 15, lineHeight: 22, marginTop: 8 },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 12,
  },
  subTitle: {
    color: "#a5b4fc",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  yieldVal: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
    marginLeft: 24,
  },

  // Citation
  citationBox: {
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    borderColor: "rgba(251, 191, 36, 0.3)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  citationTitle: { color: "#fcd34d", fontWeight: "700", fontSize: 14 },
  citationText: { color: "#d1d5db", fontSize: 13, marginTop: 6 },
  citationBullet: { color: "#9ca3af", fontSize: 12, marginTop: 4 },

  // Table
  table: {
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 8,
  },
  tHead: {
    flexDirection: "row",
    backgroundColor: "#1f2937",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  th: {
    color: "#9ca3af",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  tRow: {
    flexDirection: "row",
    backgroundColor: "#111827",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
    alignItems: "center",
  },
  td: { color: "#e5e7eb", fontSize: 13 },
  gpsText: { color: "#6b7280", fontSize: 10, fontFamily: "monospace" },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 9, fontWeight: "800" },

  // Buttons & Misc
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonBack: { backgroundColor: "#374151" },
  buttonSubmit: { backgroundColor: "#16a34a" },
  buttonDisabled: { backgroundColor: "#4b5563" },
  buttonSubmitText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },

  errorBox: {
    backgroundColor: "#451a1a",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#7f1d1d",
  },
  errorText: { color: "#fecaca", fontSize: 16, lineHeight: 22 },

  zoomIconOverlay: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 6,
    borderRadius: 6,
  },
  hintText: { color: "#6b7280", fontSize: 12, marginBottom: 8 },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  modalHint: {
    position: "absolute",
    bottom: 40,
    color: "#6b7280",
    fontSize: 12,
  },
});
