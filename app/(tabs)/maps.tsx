import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import MapView, {
  LatLng,
  Marker,
  Polygon,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import ViewShot from "react-native-view-shot";

const TARGET = 1024; // >= 640
const PAD = 1.15; // nới vùng chụp
const R = 6378137; // bán kính WGS84 (m)

// region vuông bao đa giác
function toSquareRegion(points: LatLng[]): Region {
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats),
    maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs),
    maxLng = Math.max(...lngs);
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const side = Math.max(maxLat - minLat, maxLng - minLng) * PAD || 0.001;
  return {
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta: side,
    longitudeDelta: side,
  };
}

// Web Mercator (m)
const toMerc = (p: LatLng) => {
  const x = (p.longitude * Math.PI) / 180;
  const yRad = (p.latitude * Math.PI) / 180;
  const y = Math.log(Math.tan(Math.PI / 4 + yRad / 2));
  return { x: R * x, y: R * y };
};
// Diện tích đa giác (m²) theo shoelace trên mặt phẳng Mercator
function areaSqm(points: LatLng[]): number {
  const ps = points.map(toMerc);
  let s = 0;
  for (let i = 0; i < ps.length; i++) {
    const a = ps[i],
      b = ps[(i + 1) % ps.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
}
// Centroid gần đúng (lat,lng) từ trung bình Mercator
function centroid(points: LatLng[]): LatLng {
  const ps = points.map(toMerc);
  const cx = ps.reduce((a, p) => a + p.x, 0) / ps.length;
  const cy = ps.reduce((a, p) => a + p.y, 0) / ps.length;
  const lng = (cx / R) * (180 / Math.PI);
  const lat = (2 * Math.atan(Math.exp(cy / R)) - Math.PI / 2) * (180 / Math.PI);
  return { latitude: lat, longitude: lng };
}

export default function DatePalmParcelPicker() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const [points, setPoints] = useState<LatLng[]>([]);
  const [mapSizeDp, setMapSizeDp] = useState({ w: 0, h: 0 });

  const [showPins, setShowPins] = useState(true);

  // processor ẩn
  const [snapshotUri, setSnapshotUri] = useState<string | null>(null);
  const [polyPx, setPolyPx] = useState<{ x: number; y: number }[]>([]);
  const viewShotRef = useRef<ViewShot>(null);

  const onPressMap = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPoints((prev) => [...prev, { latitude, longitude }]);
  };
  const undo = () => setPoints((prev) => prev.slice(0, -1));
  const resetAll = () => setPoints([]);

  const captureParcel = async () => {
    if (!mapRef.current || points.length < 3 || !mapSizeDp.w || !mapSizeDp.h)
      return;

    // tính region, centroid, diện tích
    const region = toSquareRegion(points);
    const center = centroid(points);
    const area_m2 = areaSqm(points);
    const area_ha = area_m2 / 10000;

    // ẩn pin để không dính vào ảnh
    setShowPins(false);

    // ép camera và đợi khung hình
    mapRef.current.animateToRegion(region, 0);
    await new Promise((r) => setTimeout(r, 400));

    // chụp snapshot vuông
    const path = await mapRef.current.takeSnapshot({
      width: TARGET,
      height: TARGET,
      format: "png",
      quality: 1,
      result: "file",
      region,
    });
    const snapUri = path?.startsWith("file://") ? path : `file://${path}`;
    if (!snapUri) {
      setShowPins(true);
      return;
    }

    // polygon -> pixel bằng pointForCoordinate rồi scale sang TARGET
    const pts: { x: number; y: number }[] = [];
    for (const p of points) {
      // @ts-ignore
      const pt = await mapRef.current.pointForCoordinate(p); // dp
      const x = (pt.x / mapSizeDp.w) * TARGET;
      const y = (pt.y / mapSizeDp.h) * TARGET;
      pts.push({ x, y });
    }

    // lưu và điều hướng
    setSnapshotUri(snapUri);
    setPolyPx(pts);

    // gửi kèm meta qua params
    router.push({
      pathname: "/(tabs)/result",
      params: {
        uri: snapUri,
        polygon: JSON.stringify(points),
        center: JSON.stringify(center),
        area_m2: String(Math.round(area_m2)),
        area_ha: String(area_ha),
      },
    });

    // khôi phục pin sau khi điều hướng
    setTimeout(() => setShowPins(true), 500);
  };

  const polyAttr = polyPx.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        mapType="satellite"
        initialRegion={{
          latitude: 25.383,
          longitude: 49.588,
          latitudeDelta: 0.25,
          longitudeDelta: 0.25,
        }}
        onPress={onPressMap}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setMapSizeDp({ w: width, h: height });
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
            <Text style={{ color: "#fff" }}>Undo điểm</Text>
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
          onPress={captureParcel}
          style={{
            backgroundColor: points.length < 3 ? "#4b5563" : "#16a34a",
            paddingVertical: 14,
            borderRadius: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            Chụp & che viền ngoài {TARGET}×{TARGET}
          </Text>
        </Pressable>
      </View>

      {/* Nếu muốn debug mask trước khi gửi có thể bật khối dưới.
      {snapshotUri && (
        <View style={{ position: "absolute", left: -10000, top: -10000, width: TARGET, height: TARGET, opacity: 0.01 }}>
          <ViewShot ref={viewShotRef} style={{ width: TARGET, height: TARGET }}>
            <Svg width={TARGET} height={TARGET} viewBox={`0 0 ${TARGET} ${TARGET}`}>
              <Defs><ClipPath id="clip"><SvgPolygon points={polyAttr} /></ClipPath></Defs>
              <Rect x={0} y={0} width={TARGET} height={TARGET} fill="black" />
              <SvgImage href={{ uri: snapshotUri }} width={TARGET} height={TARGET} clipPath="url(#clip)" preserveAspectRatio="xMidYMid slice" />
            </Svg>
          </ViewShot>
        </View>
      )} */}
    </View>
  );
}
