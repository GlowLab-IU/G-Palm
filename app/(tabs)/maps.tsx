import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
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

const TARGET_PX = 640;
const PAD_REGION = 1.001;
const OUT_PAD_PX = 0;
const R = 6378137;

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

type BBox = { minLat: number; minLng: number; maxLat: number; maxLng: number };
function regionToBBox(r: Region): BBox {
  const halfLat = r.latitudeDelta / 2;
  const halfLng = r.longitudeDelta / 2;
  return {
    minLat: r.latitude - halfLat,
    maxLat: r.latitude + halfLat,
    minLng: r.longitude - halfLng,
    maxLng: r.longitude + halfLng,
  };
}
function polyBBox(points: LatLng[]): BBox {
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}
function bboxIntersect(a: BBox, b: BBox): boolean {
  return !(
    a.minLat > b.maxLat ||
    a.maxLat < b.minLat ||
    a.minLng > b.maxLng ||
    a.maxLng < b.minLng
  );
}
function bboxOf(points: LatLng[]): BBox {
  return polyBBox(points);
}
function clipPolyToBBox(points: LatLng[], box: BBox): LatLng[] {
  type Edge = (p: LatLng) => boolean;
  type Inter = (p1: LatLng, p2: LatLng) => LatLng;
  const edges: { inside: Edge; intersect: Inter }[] = [
    {
      inside: (p) => p.longitude >= box.minLng,
      intersect: (p1, p2) => {
        const x = box.minLng;
        const t = (x - p1.longitude) / (p2.longitude - p1.longitude);
        return {
          latitude: p1.latitude + t * (p2.latitude - p1.latitude),
          longitude: x,
        };
      },
    },
    {
      inside: (p) => p.longitude <= box.maxLng,
      intersect: (p1, p2) => {
        const x = box.maxLng;
        const t = (x - p1.longitude) / (p2.longitude - p1.longitude);
        return {
          latitude: p1.latitude + t * (p2.latitude - p1.latitude),
          longitude: x,
        };
      },
    },
    {
      inside: (p) => p.latitude >= box.minLat,
      intersect: (p1, p2) => {
        const y = box.minLat;
        const t = (y - p1.latitude) / (p2.latitude - p1.latitude);
        return {
          latitude: y,
          longitude: p1.longitude + t * (p2.longitude - p1.longitude),
        };
      },
    },
    {
      inside: (p) => p.latitude <= box.maxLat,
      intersect: (p1, p2) => {
        const y = box.maxLat;
        const t = (y - p1.latitude) / (p2.latitude - p1.latitude);
        return {
          latitude: y,
          longitude: p1.longitude + t * (p2.longitude - p1.longitude),
        };
      },
    },
  ];
  let output = points.slice();
  for (const { inside, intersect } of edges) {
    const input = output.slice();
    output = [];
    for (let i = 0; i < input.length; i++) {
      const A = input[i];
      const B = input[(i + 1) % input.length];
      const Ain = inside(A);
      const Bin = inside(B);
      if (Ain && Bin) {
        output.push(B);
      } else if (Ain && !Bin) {
        output.push(intersect(A, B));
      } else if (!Ain && Bin) {
        output.push(intersect(A, B));
        output.push(B);
      }
    }
    if (!output.length) break;
  }
  return output;
}
function latLngToTilePx(
  p: LatLng,
  box: BBox,
  W: number,
  H: number
): { x: number; y: number } {
  const x = ((p.longitude - box.minLng) / (box.maxLng - box.minLng)) * W;
  const y = ((box.maxLat - p.latitude) / (box.maxLat - box.minLat)) * H; // y xuống dưới
  return { x, y };
}

type OctantNode = {
  id: string;
  region: Region;
  bbox: BBox;
};
function splitRegion4(parent: Region): Region[] {
  const halfLat = parent.latitudeDelta / 2;
  const halfLng = parent.longitudeDelta / 2;
  const centers = [
    { dLat: -halfLat / 2, dLng: -halfLng / 2 }, // 0: TL
    { dLat: -halfLat / 2, dLng: +halfLng / 2 }, // 1: TR
    { dLat: +halfLat / 2, dLng: -halfLng / 2 }, // 2: BL
    { dLat: +halfLat / 2, dLng: +halfLng / 2 }, // 3: BR
  ];
  return centers.map(({ dLat, dLng }) => ({
    latitude: parent.latitude + dLat,
    longitude: parent.longitude + dLng,
    latitudeDelta: halfLat,
    longitudeDelta: halfLng,
  }));
}
function toChildNodes(parentId: string, parent: Region): OctantNode[] {
  const kids = splitRegion4(parent);
  return kids.map((r, i) => ({
    id: parentId + String(i),
    region: r,
    bbox: regionToBBox(r),
  }));
}

// ========== Component ==========
export default function DatePalmParcelPicker() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const viewShotRef = useRef<ViewShot>(null);

  const [points, setPoints] = useState<LatLng[]>([]);
  const [showPins, setShowPins] = useState(true);

  const [tileSnap, setTileSnap] = useState<{
    uri: string;
    W: number;
    H: number;
  } | null>(null);
  const [tileClip, setTileClip] = useState<{
    ptsPx: { x: number; y: number }[];
    box: BBox;
  } | null>(null);

  const BASE_OCTANT_ID = "30524043435362555123";
  const MAX_DEPTH = 6;
  const STOP_WHEN_PIXEL_SCALE_OK = true;

  const onPressMap = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPoints((prev) => [...prev, { latitude, longitude }]);
  };
  const undo = () => setPoints((prev) => prev.slice(0, -1));
  const resetAll = () => setPoints([]);

  async function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // Quyết định dừng chia nhỏ: nếu bbox giao với ô nhỏ rồi hoặc side ô nhỏ hơn ngưỡng
  function shouldStop(region: Region, depth: number): boolean {
    if (depth >= MAX_DEPTH) return true;
    if (!STOP_WHEN_PIXEL_SCALE_OK) return false;
    // Đơn giản: nếu ô hiện tại khi chụp 640×640 sẽ có scale đủ mịn
    // ở đây ta không biết m/px chính xác, nên dừng theo nhỏ dần: khi delta < 1e-4 deg ~ 11m ở xích đạo
    const minDelta = 1e-4;
    return (
      region.latitudeDelta <= minDelta && region.longitudeDelta <= minDelta
    );
  }

  function coverWithOctants(poly: LatLng[], rootRegion: Region): OctantNode[] {
    const out: OctantNode[] = [];
    const stack: { id: string; region: Region; depth: number }[] = [
      { id: BASE_OCTANT_ID, region: rootRegion, depth: 0 },
    ];
    const polyBB = polyBBox(poly);

    while (stack.length) {
      const cur = stack.pop()!;
      const curBox = regionToBBox(cur.region);
      // loại nhanh theo bbox
      if (!bboxIntersect(polyBB, curBox)) continue;
      // clip polygon
      const clipped = clipPolyToBBox(poly, curBox);
      if (clipped.length < 3) continue;

      if (shouldStop(cur.region, cur.depth)) {
        out.push({ id: cur.id, region: cur.region, bbox: curBox });
      } else {
        const kids = toChildNodes(cur.id, cur.region);
        for (const k of kids)
          stack.push({ id: k.id, region: k.region, depth: cur.depth + 1 });
      }
    }
    return out;
  }

  async function captureOneOctant(node: OctantNode, polygon: LatLng[]) {
    if (!mapRef.current) return null;

    setShowPins(false);
    mapRef.current.animateToRegion(node.region, 0);
    await sleep(250);
    const width = TARGET_PX,
      height = TARGET_PX;
    const snapshotPath = await mapRef.current.takeSnapshot({
      width,
      height,
      format: "png",
      quality: 1,
      result: "file",
      region: node.region,
    });
    const uri = snapshotPath?.startsWith("file://")
      ? snapshotPath
      : `file://${snapshotPath}`;
    if (!uri) return null;

    const clipped = clipPolyToBBox(polygon, node.bbox);
    if (clipped.length < 3) return null;

    const ptsPx = clipped.map((p) =>
      latLngToTilePx(p, node.bbox, width, height)
    );
    setTileSnap({ uri, W: width, H: height });
    setTileClip({ ptsPx, box: node.bbox });

    await new Promise((r) => requestAnimationFrame(() => r(null)));
    await sleep(16);

    const maskedTmp = await captureRef(viewShotRef, {
      format: "png",
      result: "tmpfile",
      quality: 1,
      width,
      height,
    });

    const bbox_latlng = node.bbox;
    const meta = {
      octant: node.id,
      bbox_latlng,
    };

    router.push({
      pathname: "/(tabs)/result",
      params: {
        uri: maskedTmp,
        polygon: JSON.stringify(polygon),
        meta: JSON.stringify(meta),
      },
    });

    setTileSnap(null);
    setTileClip(null);

    return { uri: maskedTmp, meta };
  }

  const captureOctantFlow = async () => {
    if (!mapRef.current || points.length < 3) return;

    try {
      const baseRegion = toSquareRegion(points);
      const center = centroid(points);
      const area_m2 = areaSqm(points);
      const area_ha = area_m2 / 10000;

      const nodes = coverWithOctants(points, baseRegion);
      if (!nodes.length) {
        Alert.alert("Không tìm thấy ô giao đa giác.");
        return;
      }

      for (const node of nodes) {
        await captureOneOctant(node, points);

        await sleep(60);
      }

      setTimeout(() => setShowPins(true), 200);

      console.log("center:", center, "area_ha:", area_ha);
    } catch (e: any) {
      Alert.alert("Lỗi chụp octant", String(e?.message || e));
      setShowPins(true);
    }
  };

  const polyAttrPx =
    tileClip?.ptsPx
      ?.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`)
      .join(" ") || "";

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
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
            <Text style={{ color: "#fff" }}>Undo</Text>
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
          onPress={captureOctantFlow}
          style={{
            backgroundColor: points.length < 3 ? "#4b5563" : "#16a34a",
            paddingVertical: 14,
            borderRadius: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            Chụp theo octant 640×640
          </Text>
        </Pressable>
      </View>

      {tileSnap && tileClip && (
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
              width={tileSnap.W}
              height={tileSnap.H}
              viewBox={`0 0 ${tileSnap.W} ${tileSnap.H}`}
            >
              <Defs>
                <ClipPath id="clip">
                  <SvgPolygon points={polyAttrPx} />
                </ClipPath>
              </Defs>
              <SvgImage
                href={{ uri: tileSnap.uri }}
                width={tileSnap.W}
                height={tileSnap.H}
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
