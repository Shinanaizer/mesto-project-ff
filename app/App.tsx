import { StatusBar } from "expo-status-bar";
import { useEffect, useState, type ReactNode } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  changeExtraHan,
  changeFu,
  decideFu,
  DEFAULT_FU,
  scoreParts,
  type FuDecision,
} from "./src/scoring/combine";
import {
  formatHan,
  formatPoints,
  limitLabel,
  paymentLines,
  winByLabel,
  winnerLabel,
  type Winner,
  type WinBy,
} from "./src/scoring/score";
import { ZERO_COUNTERS, type HanCounters, type YakuId } from "./src/yaku/catalog";
import { YakuPicker } from "./src/yaku/YakuPicker";
import { dropClosedOnly, impliedFuValues, sumYaku, toggleYaku } from "./src/yaku/sum";

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

export default function App() {
  return (
    <SafeAreaProvider style={styles.provider}>
      <Scorer />
    </SafeAreaProvider>
  );
}

function Scorer() {
  const [extraHan, setExtraHan] = useState(0);
  const [fu, setFu] = useState(DEFAULT_FU);
  const [winner, setWinner] = useState<Winner>("nonDealer");
  const [winBy, setWinBy] = useState<WinBy>("ron");
  const [closed, setClosed] = useState(true);
  const [selected, setSelected] = useState<YakuId[]>([]);
  const [counters, setCounters] = useState<HanCounters>(ZERO_COUNTERS);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    document.title = "Счёт ричи";
    document.documentElement.lang = "ru";
    document.body.style.backgroundColor = colors.bg;
    document.documentElement.style.backgroundColor = colors.bg;
  }, []);

  const yakuSum = sumYaku({ closed, selected, counters });
  const impliedFu = impliedFuValues(selected, closed);
  const fuDecision = decideFu(fu, impliedFu);
  const han = yakuSum.yakuman > 0 ? 0 : yakuSum.han + extraHan;
  const score = scoreParts({
    yakuHan: yakuSum.han,
    extraHan,
    fu,
    impliedFu,
    yakuman: yakuSum.yakuman,
    winner,
    winBy,
  });
  const lines = score ? paymentLines(score) : [];
  const badge = score ? limitLabel(score) : null;
  const fuText = fuLabel(fuDecision);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.column}>
        <View style={styles.top}>
          <Text style={styles.title}>Счёт ричи</Text>
          <View style={styles.result} accessibilityRole="summary">
            <Text style={styles.eyebrow}>Общие очки</Text>
            <Text
              style={score ? styles.points : styles.pointsEmpty}
              testID="total-points"
              accessibilityLiveRegion="polite"
            >
              {score ? formatPoints(score.total) : "—"}
            </Text>
            <View style={styles.badgeSlot}>
              {badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.meta} testID="hand-summary">
              {yakuSum.yakuman > 0
                ? "якуман"
                : `${fuText} · ${han < 1 ? "нет хан" : `${formatHan(han)} хан`}`}
            </Text>
            <View style={styles.noteSlot}>
              {fuDecision.status === "implied" && yakuSum.yakuman === 0 ? (
                <Text style={styles.yakuHan} testID="fu-from-yaku" numberOfLines={2}>
                  Фу из яку: {fuDecision.fu}
                </Text>
              ) : null}
              {fuDecision.status === "conflict" && yakuSum.yakuman === 0 ? (
                <Text style={styles.yakuHan} testID="fu-conflict" numberOfLines={2}>
                  Фу яку не сходятся. Задайте фу вручную.
                </Text>
              ) : null}
            </View>
            <View style={styles.detailSlot}>
              {yakuSum.active ? (
                <Text style={styles.yakuHan} testID="yaku-han" numberOfLines={1}>
                  {yakuSum.yakuman > 0 ? `Из яку: ${badge}` : `Из яку: ${yakuSum.han}`}
                </Text>
              ) : null}
            </View>
            <View style={styles.detailSlot}>
              {extraHan > 0 && yakuSum.yakuman === 0 ? (
                <Text style={styles.yakuHan} testID="extra-han" numberOfLines={1}>
                  Ещё хан: {extraHan}
                </Text>
              ) : null}
            </View>
            <Text style={styles.who} testID="winner-summary">
              {winnerLabel(winner)} · {winByLabel(winBy)}
            </Text>
            <View style={styles.paySlot}>
              <Text style={styles.pay} numberOfLines={1}>
                {lines[0] ?? ""}
              </Text>
              <Text style={styles.pay} numberOfLines={1}>
                {lines[1] ?? ""}
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Section title="Хан">
            <ValueCounter
              value={extraHan}
              description="Плюс к хан из яку. Если яку не выбраны, это весь хан."
              decreaseLabel="Хан меньше"
              increaseLabel="Хан больше"
              testID="han"
              onDecrease={() => setExtraHan((current) => changeExtraHan(current, -1))}
              onIncrease={() => setExtraHan((current) => changeExtraHan(current, 1))}
            />
            {han >= 13 && yakuSum.yakuman === 0 ? (
              <Hint>13 и больше хан — кадзоэ-якуман, очки одного якмана.</Hint>
            ) : han >= 5 && yakuSum.yakuman === 0 ? (
              <Hint>С 5 хан число фу на очки не влияет.</Hint>
            ) : null}
          </Section>

          <Section title="Фу">
            <ValueCounter
              value={fu}
              description="По умолчанию 30. Ноль берёт фу у пинфу и тиитойцу. От 20 заданное число важнее."
              decreaseLabel="Фу меньше"
              increaseLabel="Фу больше"
              testID="fu"
              onDecrease={() => setFu((current) => changeFu(current, -1))}
              onIncrease={() => setFu((current) => changeFu(current, 1))}
            />
          </Section>

          <Section title="Кто выиграл">
            <View style={styles.pair}>
              <BlockChoice
                label="Не-дилер"
                selected={winner === "nonDealer"}
                onPress={() => setWinner("nonDealer")}
                testID="winner-non-dealer"
              />
              <BlockChoice
                label="Дилер"
                selected={winner === "dealer"}
                onPress={() => setWinner("dealer")}
                testID="winner-dealer"
              />
            </View>
          </Section>

          <Section title="Победа">
            <View style={styles.pair}>
              <BlockChoice
                label="Рон"
                selected={winBy === "ron"}
                onPress={() => setWinBy("ron")}
                testID="win-ron"
              />
              <BlockChoice
                label="Цумо"
                selected={winBy === "tsumo"}
                onPress={() => setWinBy("tsumo")}
                testID="win-tsumo"
              />
            </View>
          </Section>

          <Section title="Яку">
            <YakuPicker
              closed={closed}
              onClosedChange={(next) => {
                setClosed(next);
                if (!next) setSelected((current) => dropClosedOnly(current));
              }}
              selected={selected}
              onToggle={(id) => setSelected((current) => toggleYaku(current, id))}
              counters={counters}
              onCounter={(id, value) => setCounters((current) => ({ ...current, [id]: value }))}
              sum={yakuSum}
              onClear={() => {
                setSelected([]);
                setCounters(ZERO_COUNTERS);
              }}
            />
          </Section>

          <Text style={styles.footer}>
            Обычный счёт, без кириагэ-манган. Риити и дабури-риити не складываются.
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function fuLabel(decision: FuDecision): string {
  if (decision.status === "explicit" || decision.status === "implied") return `${decision.fu} фу`;
  if (decision.status === "conflict") return "фу не сходятся";
  return "фу не заданы";
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Hint({ children }: { children: string }) {
  return <Text style={styles.hint}>{children}</Text>;
}

function ValueCounter({
  value,
  description,
  decreaseLabel,
  increaseLabel,
  testID,
  onDecrease,
  onIncrease,
}: {
  value: number;
  description: string;
  decreaseLabel: string;
  increaseLabel: string;
  testID: string;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <View style={styles.counter}>
      <Text style={styles.counterDescription}>{description}</Text>
      <View style={styles.stepper}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={decreaseLabel}
          testID={`${testID}-dec`}
          onPress={onDecrease}
          style={({ pressed }) => [styles.step, pressed && styles.chipPressed]}
        >
          <Text style={styles.stepText}>−</Text>
        </Pressable>
        <Text style={styles.count} testID={`${testID}-count`}>
          {value}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={increaseLabel}
          testID={`${testID}-inc`}
          onPress={onIncrease}
          style={({ pressed }) => [styles.step, pressed && styles.chipPressed]}
        >
          <Text style={styles.stepText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function BlockChoice({
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
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.block,
        selected && styles.chipSelected,
        pressed && styles.chipPressed,
      ]}
    >
      <Text style={[styles.blockText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  provider: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
  },
  column: {
    flex: 1,
    width: "100%",
    maxWidth: 480,
  },
  top: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  title: {
    color: colors.gold,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  result: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    alignItems: "center",
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  points: {
    color: colors.text,
    fontSize: 64,
    fontWeight: "800",
    lineHeight: 72,
    fontVariant: ["tabular-nums"],
  },
  pointsEmpty: {
    color: colors.muted,
    fontSize: 64,
    fontWeight: "800",
    lineHeight: 72,
  },
  badgeSlot: {
    minHeight: 32,
    justifyContent: "center",
    marginBottom: 4,
  },
  badge: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  badgeText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
  },
  meta: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  who: {
    color: colors.muted,
    fontSize: 16,
    marginTop: 2,
    marginBottom: 6,
  },
  noteSlot: {
    height: 48,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  detailSlot: {
    height: 24,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  yakuHan: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "center",
  },
  paySlot: {
    height: 48,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  pay: {
    color: colors.pay,
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24,
    textAlign: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 22,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  counter: {
    gap: 10,
  },
  counterDescription: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  step: {
    width: 64,
    height: 64,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.chipEdge,
    backgroundColor: colors.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 36,
  },
  count: {
    minWidth: 64,
    color: colors.text,
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  chip: {
    flexGrow: 0,
    flexBasis: "22%",
    width: "22%",
    minHeight: 56,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.chipEdge,
    backgroundColor: colors.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  chipPressed: {
    opacity: 0.75,
  },
  chipText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  chipTextSelected: {
    color: colors.ink,
  },
  pair: {
    flexDirection: "row",
    gap: 8,
  },
  block: {
    flex: 1,
    minHeight: 64,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.chipEdge,
    backgroundColor: colors.chip,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  blockText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  hint: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
});
