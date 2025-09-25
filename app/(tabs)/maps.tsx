import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { PixelRatio, Pressable, Text, View } from "react-native";
import MapView, {
  LatLng,
  Marker,
  Polygon,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import Svg, {
  ClipPath,
  Defs,
  Image as SvgImage,
  Polygon as SvgPolygon,
} from "react-native-svg";
import ViewShot, { captureRef } from "react-native-view-shot";

const MIN_TARGET = 640; // cạnh dài tối thiểu ảnh xuất
const PAD_REGION = 1.03; // nới region khi chụp snapshot
const OUT_PAD_PX = 8; // chừa viền nhỏ khi crop
const R = 6378137;

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
  const side = Math.max(maxLat - minLat, maxLng - minLng) * PAD_REGION || 0.001;
  return {
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta: side,
    longitudeDelta: side,
  };
}

// Mercator để tính diện tích và centroid
const toMerc = (p: LatLng) => {
  const x = (p.longitude * Math.PI) / 180;
  const yRad = (p.latitude * Math.PI) / 180;
  const y = Math.log(Math.tan(Math.PI / 4 + yRad / 2));
  return { x: R * x, y: R * y };
};
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

  // snapshot/meta
  const [snapshotUri, setSnapshotUri] = useState<string | null>(null);
  const [snapW, setSnapW] = useState(0);
  const [snapH, setSnapH] = useState(0);
  const [polyPx, setPolyPx] = useState<{ x: number; y: number }[]>([]);
  const [bbox, setBbox] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [meta, setMeta] = useState<{
    center: LatLng;
    area_m2: number;
    area_ha: number;
  } | null>(null);

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

    const region = toSquareRegion(points);
    const center = centroid(points);
    const area_m2 = areaSqm(points);
    const area_ha = area_m2 / 10000;

    setShowPins(false);
    mapRef.current.animateToRegion(region, 0);
    await new Promise((r) => setTimeout(r, 400));

    // chụp snapshot đúng pixel thật của MapView
    const scale = PixelRatio.get();
    const viewPxW = Math.round(mapSizeDp.w * scale);
    const viewPxH = Math.round(mapSizeDp.h * scale);

    const path = await mapRef.current.takeSnapshot({
      width: viewPxW,
      height: viewPxH,
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

    // polygon → pixel thật
    const pts: { x: number; y: number }[] = [];
    for (const p of points) {
      // @ts-ignore
      const pt = await mapRef.current.pointForCoordinate(p); // dp
      pts.push({ x: Math.round(pt.x * scale), y: Math.round(pt.y * scale) });
    }

    // bbox sát đa giác
    const xs = pts.map((p) => p.x),
      ys = pts.map((p) => p.y);
    let minX = Math.max(0, Math.min(...xs) - OUT_PAD_PX);
    let minY = Math.max(0, Math.min(...ys) - OUT_PAD_PX);
    let maxX = Math.min(viewPxW, Math.max(...xs) + OUT_PAD_PX);
    let maxY = Math.min(viewPxH, Math.max(...ys) + OUT_PAD_PX);
    const box = {
      x: Math.floor(minX),
      y: Math.floor(minY),
      w: Math.max(1, Math.ceil(maxX - minX)),
      h: Math.max(1, Math.ceil(maxY - minY)),
    };

    setSnapshotUri(snapUri);
    setSnapW(viewPxW);
    setSnapH(viewPxH);
    setPolyPx(pts);
    setBbox(box);
    setMeta({ center, area_m2, area_ha });
  };

  // render SVG cắt theo bbox và xuất PNG alpha, phóng to ≥640
  useEffect(() => {
    if (
      !snapshotUri ||
      !bbox ||
      polyPx.length < 3 ||
      !viewShotRef.current ||
      !meta
    )
      return;
    let alive = true;
    (async () => {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await new Promise((r) => setTimeout(r, 16));
      if (!alive) return;

      const scale = Math.max(MIN_TARGET / Math.max(bbox.w, bbox.h), 1);
      const outW = Math.round(bbox.w * scale);
      const outH = Math.round(bbox.h * scale);

      const maskedPng = await captureRef(viewShotRef, {
        format: "png",
        result: "tmpfile",
        quality: 1,
        width: outW,
        height: outH,
      });
      if (!alive || !maskedPng) return;

      router.push({
        pathname: "/(tabs)/result",
        params: {
          uri: maskedPng,
          polygon: JSON.stringify(points),
          center: JSON.stringify(meta.center),
          area_m2: String(Math.round(meta.area_m2)),
          area_ha: String(meta.area_ha),
        },
      });

      setSnapshotUri(null);
      setPolyPx([]);
      setBbox(null);
      setMeta(null);
      setSnapW(0);
      setSnapH(0);
      setTimeout(() => setShowPins(true), 300);
    })();
    return () => {
      alive = false;
    };
  }, [snapshotUri, bbox, polyPx, meta]);

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
          onPress={captureParcel}
          style={{
            backgroundColor: points.length < 3 ? "#4b5563" : "#16a34a",
            paddingVertical: 14,
            borderRadius: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            Crop tightly to boundary ≥{MIN_TARGET}px
          </Text>
        </Pressable>
      </View>

      {/* Processor ẩn: crop theo bbox, ngoài ranh = trong suốt */}
      {snapshotUri && bbox && (
        <View
          style={{
            position: "absolute",
            left: -10000,
            top: -10000,
            backgroundColor: "transparent",
          }}
          collapsable={false}
        >
          <ViewShot
            ref={viewShotRef}
            style={{ backgroundColor: "transparent" }}
          >
            <Svg
              width={bbox.w}
              height={bbox.h}
              viewBox={`${bbox.x} ${bbox.y} ${bbox.w} ${bbox.h}`} // crop đúng bbox
            >
              <Defs>
                <ClipPath id="clip">
                  <SvgPolygon points={polyAttr} />
                </ClipPath>
              </Defs>
              <SvgImage
                href={{ uri: snapshotUri }}
                width={snapW}
                height={snapH}
                clipPath="url(#clip)"
                preserveAspectRatio="none"
              />
            </Svg>
          </ViewShot>
        </View>
      )}
    </View>
  );
}
