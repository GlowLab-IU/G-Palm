import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  PixelRatio,
  Pressable,
  Text,
  View,
} from "react-native";
import MapView, {
  LatLng,
  Marker,
  Polygon,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";

const R = 6378137;
const PAD_REGION = 1.03;

const toMerc = (p: LatLng) => {
  const x = (p.longitude * Math.PI) / 180;
  const yRad = (p.latitude * Math.PI) / 180;
  const y = Math.log(Math.tan(Math.PI / 4 + yRad / 2));
  return { x: R * x, y: R * y };
};
function areaSqm(points: LatLng[]): number {
  if (points.length < 3) return 0;
  const ps = points.map(toMerc);
  let s = 0;
  for (let i = 0; i < ps.length; i++) {
    const a = ps[i],
      b = ps[(i + 1) % ps.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
}
function centroid(points: LatLng[]): LatLng {
  if (points.length === 0) return { latitude: 0, longitude: 0 };
  const ps = points.map(toMerc);
  const cx = ps.reduce((a, p) => a + p.x, 0) / ps.length;
  const cy = ps.reduce((a, p) => a + p.y, 0) / ps.length;
  const lng = (cx / R) * (180 / Math.PI);
  const lat = (2 * Math.atan(Math.exp(cy / R)) - Math.PI / 2) * (180 / Math.PI);
  return { latitude: lat, longitude: lng };
}

function toSquareRegion(points: LatLng[]): Region {
  if (points.length === 0) {
    return {
      latitude: 25.383,
      longitude: 49.588,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats),
    maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs),
    maxLng = Math.max(...lngs);
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const latDelta = Math.max(maxLat - minLat, 0.0005);
  const lngDelta = Math.max(maxLng - minLng, 0.0005);
  const sideDelta = Math.max(latDelta, lngDelta) * PAD_REGION;
  return {
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta: Math.min(Math.max(sideDelta, 0.0005), 1),
    longitudeDelta: Math.min(Math.max(sideDelta, 0.0005), 1),
  };
}

export default function DatePalmParcelPicker() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const [points, setPoints] = useState<LatLng[]>([]);
  const [showPins, setShowPins] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [mapSizeDp, setMapSizeDp] = useState({ w: 0, h: 0 });

  const onPressMap = (e: any) => {
    if (isLoading) return;
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPoints((prev) => [...prev, { latitude, longitude }]);
  };
  const undo = () => !isLoading && setPoints((prev) => prev.slice(0, -1));
  const resetAll = () => !isLoading && setPoints([]);

  const captureForDisplay = async (): Promise<string | null> => {
    if (!mapRef.current || points.length < 3 || !mapSizeDp.w || !mapSizeDp.h) {
      console.warn("Cannot capture display snapshot: insufficient data.");
      return null;
    }
    const region = toSquareRegion(points);
    mapRef.current.animateToRegion(region, 150);
    await new Promise((r) => setTimeout(r, 200));
    try {
      const maxDim = Math.max(mapSizeDp.w, mapSizeDp.h);
      const scale = PixelRatio.get();
      const targetPixelDim = Math.min(maxDim * scale, 1024);
      const snapshotWidth = Math.round((mapSizeDp.w / maxDim) * targetPixelDim);
      const snapshotHeight = Math.round(
        (mapSizeDp.h / maxDim) * targetPixelDim
      );

      const path = await mapRef.current.takeSnapshot({
        width: snapshotWidth,
        height: snapshotHeight,
        format: "jpg",
        quality: 0.8,
        result: "file",
        region: region,
      });
      const uri = path?.startsWith("file://")
        ? path
        : path
        ? `file://${path}`
        : null;

      return uri;
    } catch (error) {
      console.error("Error capturing display snapshot:", error);
      return null;
    }
  };

  const onProcessParcel = async () => {
    if (points.length < 3 || isLoading) return;
    setIsLoading(true);
    setProgressText("Capturing area...");
    setShowPins(false);
    let displayUri: string | null = null;
    try {
      displayUri = await captureForDisplay();
      setProgressText("Calculating metadata...");
      const center = centroid(points);
      const area_m2 = areaSqm(points);
      const area_ha = area_m2 / 10000;

      router.push({
        pathname: "/(tabs)/result",
        params: {
          uri: displayUri || "",
          polygon: JSON.stringify(points),
          center: JSON.stringify(center),
          area_m2: String(Math.round(area_m2)),
          area_ha: String(area_ha),
        },
      });
    } catch (e: any) {
      console.error("Error during processing:", e);
      setProgressText(`Error: ${e.message || "Unknown"}`);
      setTimeout(() => {
        setIsLoading(false);
        setProgressText("");
        setShowPins(true);
      }, 3000);
      return;
    }
    setIsLoading(false);
    setProgressText("");
    setShowPins(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Modal visible={isLoading} transparent={true} animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.75)",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text
            style={{
              color: "#fff",
              marginTop: 16,
              fontSize: 16,
              textAlign: "center",
            }}
          >
            {progressText}
          </Text>
        </View>
      </Modal>

      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        mapType="satellite"
        initialRegion={{
          latitude: 25.7030212,
          longitude: 45.6303446,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onPress={onPressMap}
        onLayout={(e) => {
          setMapSizeDp({
            w: e.nativeEvent.layout.width,
            h: e.nativeEvent.layout.height,
          });
        }}
        pitchEnabled={false}
        rotateEnabled={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {showPins &&
          points.map((p, i) => (
            <Marker key={`${p.latitude}-${p.longitude}-${i}`} coordinate={p} />
          ))}
        {points.length >= 3 && (
          <Polygon
            coordinates={points}
            strokeColor="rgba(0,150,255,1)"
            strokeWidth={2}
            fillColor="rgba(0,150,255,0.2)"
          />
        )}
      </MapView>

      {!isLoading && (
        <View
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            bottom: 20,
            gap: 8,
          }}
        >
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={undo}
              style={{
                flex: 1,
                backgroundColor: "#222",
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff" }}>Undo </Text>
            </Pressable>
            <Pressable
              onPress={resetAll}
              style={{
                flex: 1,
                backgroundColor: "#222",
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff" }}>Reset</Text>
            </Pressable>
          </View>
          <Pressable
            disabled={points.length < 3}
            onPress={onProcessParcel}
            style={{
              backgroundColor: points.length < 3 ? "#4b5563" : "#16a34a",
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              Analyze Region
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
