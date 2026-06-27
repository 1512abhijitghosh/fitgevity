import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";

type Props = {
  frames: string[];
  size: number;
  intervalMs?: number;
  active?: boolean;
};

/**
 * Alternates between two demonstration images at a fixed interval to create a
 * stop-motion animation effect. Works on web and native, fully reliable.
 */
export function ExerciseAnimation({ frames, size, intervalMs = 500, active = true }: Props) {
  const [frameIdx, setFrameIdx] = useState(0);

  useEffect(() => {
    if (!active || !frames || frames.length < 2) return;
    const t = setInterval(() => setFrameIdx((i) => (i + 1) % frames.length), intervalMs);
    return () => clearInterval(t);
  }, [active, frames, intervalMs]);

  if (!frames || frames.length === 0) {
    return <View style={[styles.box, { width: size, height: size, backgroundColor: "#1C1C1E" }]} />;
  }

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      {/* Pre-render both frames stacked; toggle opacity for a smooth swap */}
      {frames.map((src, i) => (
        <Image
          key={i}
          testID={`exercise-frame-${i}`}
          source={src}
          style={[StyleSheet.absoluteFill, { opacity: i === frameIdx ? 1 : 0 }]}
          contentFit="cover"
          transition={120}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 16, overflow: "hidden", backgroundColor: "#1C1C1E" },
});
