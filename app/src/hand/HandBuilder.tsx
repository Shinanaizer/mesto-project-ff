import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { isDealerSeat } from "./dealerSeat";
import { evaluateHand } from "../hand/evaluate";
import { formatHan, formatPoints, limitLabel, paymentLines, winByLabel, winnerLabel, type WinBy, type Winner } from "../scoring/score";
import { TileFace } from "../tiles/TileFace";
import {
  countsFromTiles,
  tileLabel,
  WINDS,
  WIND_NAME,
  type Wind,
} from "../tiles/tiles";

const colors = {
  bg: "#10241c",
  card: "#18352a",
  text: "#f7f4ec",
  muted: "#b7c9bf",
  chip: "#21493b",
  chipEdge: "#3d6b58",
  gold: "#e6b34e",
  ink: "#1b1408",
  pay: "#ffe7ad",
};

const ROWS: { title: string; ids: number[] }[] = [
  { title: "Ман", ids: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
  { title: "Пин", ids: [9, 10, 11, 12, 13, 14, 15, 16, 17] },
  { title: "Соу", ids: [18, 19, 20, 21, 22, 23, 24, 25, 26] },
  { title: "Благородные", ids: [27, 28, 29, 30, 31, 32, 33] },
];

export function HandBuilder() {
  const [tiles, setTiles] = useState<number[]>([]);
  const [winTile, setWinTile] = useState<number | null>(null);
  const [seat, setSeat] = useState<Wind>("east");
  const [round, setRound] = useState<Wind>("east");
  const [winBy, setWinBy] = useState<WinBy>("ron");
  const [dora, setDora] = useState(0);

  const counts = useMemo(() => countsFromTiles(tiles), [tiles]);
  const winner: Winner = isDealerSeat(seat) ? "dealer" : "nonDealer";
  const reading = useMemo(
    () =>
      evaluateHand({
        counts,
        seat,
        round,
        winner,
        winBy,
        dora,
        winTile,
      }),
    [counts, seat, round, winner, winBy, dora, winTile],
  );

  function addTile(id: number) {
    if (tiles.length >= 14 || counts[id] >= 4) return;
    setTiles((current) => [...current, id].sort((left, right) => left - right));
  }

  function removeTile(index: number) {
    const removed = tiles[index];
    const next = tiles.slice();
    next.splice(index, 1);
    setTiles(next);
    if (removed === winTile && !next.includes(removed)) setWinTile(null);
  }

  const points = reading.score ? formatPoints(reading.score.total) : "—";
  const badge = reading.score ? limitLabel(reading.score) : null;

  return (
    <View style={styles.screen}>
      <View style={styles.top}>
        <View style={styles.result} testID="hand-result">
          <Text style={styles.eyebrow}>Рука</Text>
          <Text style={reading.score ? styles.points : styles.pointsEmpty} testID="hand-points">
            {points}
          </Text>
          <Text style={styles.meta} numberOfLines={1} testID="hand-summary">
            {reading.status === "ready"
              ? `${reading.fu == null ? "якуман" : `${reading.fu} фу`} · ${
                  reading.yakuman > 0 ? "якуман" : reading.han < 1 ? "нет хан" : `${formatHan(reading.han)} хан`
                }`
              : "фу и хан появятся из плиток"}
          </Text>
          <View style={styles.lineSlot}>
            {badge ? <Text style={styles.badge}>{badge}</Text> : null}
          </View>
          <Text style={styles.who} numberOfLines={1}>
            {winnerLabel(winner)} · {WIND_NAME[seat]} · раунд {WIND_NAME[round]} · {winByLabel(winBy)}
          </Text>
          <View style={styles.paySlot}>
            {reading.score
              ? paymentLines(reading.score).map((line) => (
                  <Text key={line} style={styles.pay} numberOfLines={1}>
                    {line}
                  </Text>
                ))
              : null}
          </View>
          <View style={styles.yakuSlot}>
            {reading.yaku.length > 0 ? (
              <Text style={styles.yaku} numberOfLines={2} testID="hand-yaku">
                {reading.yaku.map((yaku) => (yaku.han > 0 ? `${yaku.name} ${yaku.han}` : yaku.name)).join(" · ")}
              </Text>
            ) : null}
          </View>
          <View style={styles.noteSlot}>
            {reading.waitNote ? (
              <Text style={styles.note} numberOfLines={1}>
                {reading.waitNote}
              </Text>
            ) : null}
            {reading.status === "invalid" ? (
              <Text style={styles.note} numberOfLines={1}>
                Эти 14 плиток не складываются в руку.
              </Text>
            ) : null}
          </View>
          <View style={styles.handFrame}>
            <View style={styles.handRatio} />
            <View style={styles.handSlot}>
              {tiles.length === 0 ? (
                <View style={styles.handEmpty} pointerEvents="none">
                  <Text style={styles.hint}>Рука пустая. Наберите 14 плиток.</Text>
                </View>
              ) : null}
              {tiles.map((id, index) => (
                <Pressable
                  key={`${id}-${index}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Убрать ${tileLabel(id)}`}
                  hitSlop={4}
                  onPress={() => removeTile(index)}
                  style={styles.handTile}
                  testID={`hand-tile-${index}`}
                >
                  <TileFace id={id} marked={id === winTile} />
                </Pressable>
              ))}
            </View>
          </View>
          <Text style={styles.count} testID="hand-count">
            Плиток: {tiles.length} из 14
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View>
        <Text style={styles.section}>Победная плитка</Text>
        <Text style={styles.hint}>Нужна для пинфу: засчитается, если ожидание явно с двух сторон.</Text>
        <View style={styles.winRow}>
          <View pointerEvents="none" style={styles.winTile}>
            <View style={styles.winFace} />
          </View>
          <View style={styles.winTiles}>
            {reading.winningTiles.map((id) => (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityLabel={`Победная ${tileLabel(id)}`}
                onPress={() => setWinTile((current) => (current === id ? null : id))}
                style={styles.winTile}
                testID={`win-tile-${id}`}
              >
                <TileFace id={id} marked={winTile === id} />
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <Text style={styles.field}>Ветер места</Text>
      <View style={styles.winds}>
        {WINDS.map((wind) => (
          <Choice
            key={wind}
            label={WIND_NAME[wind]}
            selected={seat === wind}
            onPress={() => setSeat(wind)}
            testID={`seat-${wind}`}
          />
        ))}
      </View>
      <Text style={styles.field}>Ветер раунда</Text>
      <View style={styles.winds}>
        {WINDS.map((wind) => (
          <Choice
            key={wind}
            label={WIND_NAME[wind]}
            selected={round === wind}
            onPress={() => setRound(wind)}
            testID={`round-${wind}`}
          />
        ))}
      </View>
      <View style={styles.pair}>
        <Choice label="Рон" selected={winBy === "ron"} onPress={() => setWinBy("ron")} testID="hand-ron" />
        <Choice label="Цумо" selected={winBy === "tsumo"} onPress={() => setWinBy("tsumo")} testID="hand-tsumo" />
      </View>

      <View style={styles.doraRow}>
        <View style={styles.doraText}>
          <Text style={styles.section}>Дора</Text>
          <Text style={styles.hint}>Индикатора в руке нет, поэтому дора задаётся числом.</Text>
        </View>
        <View style={styles.stepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Дора меньше"
            onPress={() => setDora((current) => Math.max(0, current - 1))}
            style={styles.step}
            testID="hand-dora-dec"
          >
            <Text style={styles.stepText}>−</Text>
          </Pressable>
          <Text style={styles.doraCount} testID="hand-dora-count">
            {dora}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Дора больше"
            onPress={() => setDora((current) => Math.min(12, current + 1))}
            style={styles.step}
            testID="hand-dora-inc"
          >
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setTiles([]);
          setWinTile(null);
        }}
        style={styles.clear}
        testID="hand-clear"
      >
        <Text style={styles.clearText}>Очистить руку</Text>
      </Pressable>

      {ROWS.map((row) => (
        <View key={row.title}>
          <Text style={styles.section}>{row.title}</Text>
          <View style={styles.palette}>
            {row.ids.map((id) => {
              const full = counts[id] >= 4 || tiles.length >= 14;
              return (
                <Pressable
                  key={id}
                  accessibilityRole="button"
                  accessibilityLabel={`Добавить ${tileLabel(id)}`}
                  disabled={full}
                  onPress={() => addTile(id)}
                  style={[styles.paletteTile, full && styles.full]}
                  testID={`tile-${id}`}
                >
                  <TileFace id={id} />
                  {counts[id] > 0 ? <Text style={styles.have}>{counts[id]}</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      </ScrollView>
    </View>
  );
}

function Choice({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceOn]}
      testID={testID}
    >
      <Text style={[styles.choiceText, selected && styles.choiceTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  top: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 10,
  },
  result: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
    gap: 2,
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
  },
  points: {
    color: colors.text,
    fontSize: 48,
    lineHeight: 52,
    fontWeight: "800",
  },
  pointsEmpty: {
    color: colors.muted,
    fontSize: 48,
    lineHeight: 52,
    fontWeight: "800",
  },
  meta: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
  },
  lineSlot: {
    height: 22,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  badge: {
    color: colors.ink,
    backgroundColor: colors.gold,
    overflow: "hidden",
    borderRadius: 99,
    paddingHorizontal: 10,
    fontWeight: "800",
    fontSize: 14,
    lineHeight: 18,
  },
  who: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 18,
    textAlign: "center",
  },
  paySlot: {
    height: 36,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  pay: {
    color: colors.pay,
    fontSize: 16,
    lineHeight: 18,
    fontWeight: "600",
  },
  yakuSlot: {
    height: 36,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  yaku: {
    color: colors.gold,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  noteSlot: {
    height: 18,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  note: {
    color: colors.pay,
    fontSize: 14,
    lineHeight: 18,
    textAlign: "center",
  },
  handFrame: {
    width: "100%",
  },
  handRatio: {
    width: "100%",
    aspectRatio: 2.5 / 0.7,
  },
  handSlot: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    alignContent: "flex-start",
    overflow: "hidden",
  },
  handEmpty: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  handTile: {
    width: "9.996%",
    paddingHorizontal: 1,
    paddingVertical: 1,
  },
  hint: {
    color: colors.muted,
    fontSize: 14,
  },
  count: {
    color: colors.muted,
    fontSize: 14,
  },
  section: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  field: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  pair: {
    flexDirection: "row",
    gap: 8,
  },
  winds: {
    flexDirection: "row",
    gap: 6,
  },
  choice: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.chipEdge,
    backgroundColor: colors.chip,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  choiceOn: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  choiceText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  choiceTextOn: {
    color: colors.ink,
  },
  doraRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  doraText: {
    flex: 1,
    gap: 2,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  step: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.chip,
    borderWidth: 1,
    borderColor: colors.chipEdge,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 32,
  },
  doraCount: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    minWidth: 28,
    textAlign: "center",
  },
  clear: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.chip,
  },
  clearText: {
    color: colors.text,
    fontWeight: "700",
  },
  palette: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  paletteTile: {
    width: "11.11%",
    padding: 2,
    minHeight: 64,
  },
  full: {
    opacity: 0.35,
  },
  have: {
    position: "absolute",
    right: 1,
    top: 0,
    color: colors.ink,
    backgroundColor: colors.gold,
    borderRadius: 8,
    overflow: "hidden",
    fontSize: 11,
    fontWeight: "800",
    minWidth: 16,
    textAlign: "center",
  },
  winRow: {
    gap: 0,
    overflow: "hidden",
  },
  winTiles: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0,
  },
  winFace: {
    width: "100%",
    aspectRatio: 0.74,
  },
  winTile: {
    width: "11.11%",
    padding: 2,
  },
});
