import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { PixelRatio, Pressable, Text, View } from "react-native";
import MapView, {
  LatLng,
  Marker,
  Polygon,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import Svg, {
  ClipPath,
  Defs,
  Rect,
  Image as SvgImage,
  Polygon as SvgPolygon,
} from "react-native-svg";
import ViewShot, { captureRef } from "react-native-view-shot";

const ARABIA_DEFAULT = {
  latitude: 25.383,
  longitude: 49.588,
  latitudeDelta: 0.25,
  longitudeDelta: 0.25,
};
const EXPORT = { w: 224, h: 224 };

export default function DatePalmParcelPicker() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const [mapSizePt, setMapSizePt] = useState({ w: 0, h: 0 });
  const [points, setPoints] = useState<LatLng[]>([]);

  // Processor ẩn
  const wrapperRef = useRef<View>(null);
  const viewShotRef = useRef<ViewShot>(null);
  const [proc, setProc] = useState<null | {
    imgDataUrl: string;
    poly: { x: number; y: number }[];
    bbox: { x: number; y: number; w: number; h: number };
    snapW: number;
    snapH: number;
  }>(null);
  const [imgReady, setImgReady] = useState(false);
  const polyAttr = useMemo(
    () => (proc ? proc.poly.map((p) => `${p.x},${p.y}`).join(" ") : ""),
    [proc]
  );

  // chụp 224x224 sau khi SVGImage onLoad
  useEffect(() => {
    if (!proc || !imgReady || !viewShotRef.current) return;
    let alive = true;
    (async () => {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await new Promise((r) => setTimeout(r, 30));
      if (!alive) return;
      const out = await captureRef(viewShotRef, {
        format: "png",
        result: "tmpfile",
        width: EXPORT.w,
        height: EXPORT.h,
        quality: 1,
      });
      if (!alive || !out) return;
      router.push({
        pathname: "/(tabs)/result",
        params: { uri: out, polygon: JSON.stringify(points) },
      });
      setProc(null);
      setImgReady(false);
    })();
    return () => {
      alive = false;
    };
  }, [proc, imgReady]);

  const onPressMap = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPoints((prev) => [...prev, { latitude, longitude }]);
  };
  const undo = () => setPoints((prev) => prev.slice(0, -1));
  const resetAll = () => setPoints([]);

  const captureParcel = async () => {
    if (!mapRef.current || points.length < 3 || !mapSizePt.w || !mapSizePt.h)
      return;

    // fit camera
    mapRef.current.fitToCoordinates(points, {
      edgePadding: { top: 40, left: 40, right: 40, bottom: 40 },
      animated: false,
    });
    await new Promise((r) => setTimeout(r, 350));

    // kích thước pixel thực của MapView
    const scale = PixelRatio.get();
    const snapW = Math.round(mapSizePt.w * scale);
    const snapH = Math.round(mapSizePt.h * scale);

    // toạ độ đỉnh theo "point" -> đổi sang pixel thực
    const ptsPixel: { x: number; y: number }[] = [];
    for (const p of points) {
      // @ts-ignore
      const pt = await mapRef.current.pointForCoordinate(p); // point đơn vị dp
      ptsPixel.push({ x: pt.x * scale, y: pt.y * scale }); // pixel thực
    }

    // không cần scale nữa vì snapshot = kích thước pixel thật
    const polyScreen = ptsPixel;

    // bbox trong snapshot
    const xs = polyScreen.map((p) => p.x),
      ys = polyScreen.map((p) => p.y);
    const minX = Math.max(0, Math.floor(Math.min(...xs)));
    const minY = Math.max(0, Math.floor(Math.min(...ys)));
    const maxX = Math.min(snapW, Math.ceil(Math.max(...xs)));
    const maxY = Math.min(snapH, Math.ceil(Math.max(...ys)));
    const bbox = {
      x: minX,
      y: minY,
      w: Math.max(1, maxX - minX),
      h: Math.max(1, maxY - minY),
    };

    // snapshot đúng kích thước pixel thật
    const base64 = await mapRef.current.takeSnapshot({
      width: snapW,
      height: snapH,
      format: "png",
      result: "base64",
    });
    const imgDataUrl = `data:image/png;base64,${base64}`;

    setProc({ imgDataUrl, poly: polyScreen, bbox, snapW, snapH });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        mapType="satellite"
        initialRegion={ARABIA_DEFAULT}
        onPress={onPressMap}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setMapSizePt({ w: width, h: height });
        }}
        pitchEnabled={false}
        rotateEnabled={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {points.map((p, i) => (
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
            Chụp & cắt 224×224
          </Text>
        </Pressable>
      </View>

      {/* Processor ẩn */}
      {proc ? (
        <View
          ref={wrapperRef}
          collapsable={false}
          style={{
            position: "absolute",
            opacity: 0.01,
            left: -10000,
            top: -10000,
            width: EXPORT.w,
            height: EXPORT.h,
          }}
        >
          <ViewShot
            ref={viewShotRef}
            style={{ width: EXPORT.w, height: EXPORT.h }}
          >
            <Svg
              width={EXPORT.w}
              height={EXPORT.h}
              viewBox={`${proc.bbox.x} ${proc.bbox.y} ${proc.bbox.w} ${proc.bbox.h}`}
            >
              <Defs>
                <ClipPath id="clip">
                  <SvgPolygon points={polyAttr} />
                </ClipPath>
              </Defs>
              {/* nền đen */}
              <Rect
                x={proc.bbox.x}
                y={proc.bbox.y}
                width={proc.bbox.w}
                height={proc.bbox.h}
                fill="black"
              />
              {/* ảnh clip theo đa giác */}
              <SvgImage
                href={{ uri: proc.imgDataUrl }}
                width={proc.snapW}
                height={proc.snapH}
                preserveAspectRatio="xMidYMid meet"
                clipPath="url(#clip)"
                onLoad={() => setImgReady(true)}
              />
            </Svg>
          </ViewShot>
        </View>
      ) : null}
    </View>
  );
}
