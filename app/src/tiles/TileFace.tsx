import { Image, StyleSheet, View, type ImageSourcePropType } from "react-native";

/**
 * Index is the tile id from tiles.ts: man 1–9, pin 1–9, sou 1–9,
 * then east, south, west, north, white, green, red.
 * North’s file is spelled z_nord.png.
 */
const FACES: readonly ImageSourcePropType[] = [
  require("../../assets/tiles/m_1.png"),
  require("../../assets/tiles/m_2.png"),
  require("../../assets/tiles/m_3.png"),
  require("../../assets/tiles/m_4.png"),
  require("../../assets/tiles/m_5.png"),
  require("../../assets/tiles/m_6.png"),
  require("../../assets/tiles/m_7.png"),
  require("../../assets/tiles/m_8.png"),
  require("../../assets/tiles/m_9.png"),
  require("../../assets/tiles/p_1.png"),
  require("../../assets/tiles/p_2.png"),
  require("../../assets/tiles/p_3.png"),
  require("../../assets/tiles/p_4.png"),
  require("../../assets/tiles/p_5.png"),
  require("../../assets/tiles/p_6.png"),
  require("../../assets/tiles/p_7.png"),
  require("../../assets/tiles/p_8.png"),
  require("../../assets/tiles/p_9.png"),
  require("../../assets/tiles/s_1.png"),
  require("../../assets/tiles/s_2.png"),
  require("../../assets/tiles/s_3.png"),
  require("../../assets/tiles/s_4.png"),
  require("../../assets/tiles/s_5.png"),
  require("../../assets/tiles/s_6.png"),
  require("../../assets/tiles/s_7.png"),
  require("../../assets/tiles/s_8.png"),
  require("../../assets/tiles/s_9.png"),
  require("../../assets/tiles/z_east.png"),
  require("../../assets/tiles/z_south.png"),
  require("../../assets/tiles/z_west.png"),
  require("../../assets/tiles/z_nord.png"),
  require("../../assets/tiles/z_whitedragon.png"),
  require("../../assets/tiles/z_greendragon.png"),
  require("../../assets/tiles/z_reddragon.png"),
];

const ink = "#1b1408";
const paper = "#f7f4ec";

export function TileFace({ id, marked = false }: { id: number; marked?: boolean }) {
  return (
    <View style={[styles.tile, marked && styles.marked]}>
      <Image source={FACES[id]} style={styles.face} resizeMode="contain" accessibilityIgnoresInvertColors />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: "100%",
    aspectRatio: 0.74,
    backgroundColor: paper,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: ink,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: 1,
  },
  marked: {
    borderWidth: 3,
    borderColor: "#e6b34e",
  },
  face: {
    width: "100%",
    height: "100%",
  },
});
