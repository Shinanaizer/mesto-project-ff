import { StyleSheet, Text, View } from "react-native";
import { honorMark, rankOf, suitOf } from "./tiles";

const ink = "#1b1408";
const paper = "#f7f4ec";
const red = "#c23b3b";
const green = "#217246";
const blue = "#2a5db0";

const PIN_CELLS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
  7: [0, 2, 3, 4, 5, 6, 8],
  8: [0, 1, 2, 3, 5, 6, 7, 8],
  9: [0, 1, 2, 3, 4, 5, 6, 7, 8],
};

export function TileFace({ id, marked = false }: { id: number; marked?: boolean }) {
  return (
    <View style={[styles.tile, marked && styles.marked]}>
      {suitOf(id) === "m" ? <Man rank={rankOf(id)} /> : null}
      {suitOf(id) === "p" ? <Pin rank={rankOf(id)} /> : null}
      {suitOf(id) === "s" ? <Sou rank={rankOf(id)} /> : null}
      {suitOf(id) === "z" ? <Honor id={id} /> : null}
    </View>
  );
}

function Man({ rank }: { rank: number }) {
  return (
    <View style={styles.center}>
      <Text style={styles.man}>{rank}</Text>
      <Text style={styles.manSuit}>萬</Text>
    </View>
  );
}

function Pin({ rank }: { rank: number }) {
  const cells = PIN_CELLS[rank] ?? [];
  return (
    <View style={styles.grid}>
      {Array.from({ length: 9 }, (_, cell) => (
        <View key={cell} style={styles.cell}>
          {cells.includes(cell) ? <View style={styles.dot} /> : null}
        </View>
      ))}
    </View>
  );
}

function Sou({ rank }: { rank: number }) {
  return (
    <View style={styles.bamboos}>
      {Array.from({ length: rank }, (_, index) => (
        <View key={index} style={styles.bamboo} />
      ))}
    </View>
  );
}

function Honor({ id }: { id: number }) {
  const color = id === 33 ? red : id === 32 ? green : id === 31 ? blue : ink;
  return <Text style={[styles.honor, { color }]}>{honorMark(id)}</Text>;
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
  },
  marked: {
    borderWidth: 3,
    borderColor: "#e6b34e",
  },
  center: {
    alignItems: "center",
  },
  man: {
    color: red,
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 24,
  },
  manSuit: {
    color: red,
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "700",
  },
  grid: {
    width: "78%",
    height: "78%",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: "33.33%",
    height: "33.33%",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: "70%",
    aspectRatio: 1,
    borderRadius: 99,
    backgroundColor: red,
  },
  bamboos: {
    width: "80%",
    height: "76%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  bamboo: {
    flex: 1,
    maxWidth: 5,
    height: "100%",
    borderRadius: 2,
    backgroundColor: green,
  },
  honor: {
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 30,
  },
});
