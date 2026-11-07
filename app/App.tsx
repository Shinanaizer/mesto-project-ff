import { StatusBar } from "expo-status-bar";
import { useEffect, useState, type ReactNode } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  ZERO_KANS,
  changeExtraHan,
  changeFu,
  changeKan,
  decideFu,
  DEFAULT_FU,
  kanFu,
  scoreParts,
  type FuDecision,
  type KanCounts,
} from "./src/scoring/combine";
import {
  formatHan,
  formatPoints,
  limitLabel,
  winByLabel,
  winnerLabel,
  type Winner,
  type WinBy,
} from "./src/scoring/score";
import { ZERO_COUNTERS, type HanCounters, type YakuId } from "./src/yaku/catalog";
import { YakuPicker } from "./src/yaku/YakuPicker";
import { dropClosedOnly, impliedFuValues, sumYaku, toggleYaku } from "./src/yaku/sum";
import { HandBuilder } from "./src/hand/HandBuilder";
import { BonusFields, CountRow } from "./src/game/BonusFields";
import { GameTable } from "./src/game/GameTable";
import { useLedger } from "./src/game/storage";
import { addHand, awardView, finishGame, subtractPoints, type SettleInput } from "./src/game/table";

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
  const [screen, setScreen] = useState<"counter" | "hand" | "game">("counter");
  const { ledger, setLedger, ready } = useLedger();

  function record(input: SettleInput) {
    setLedger((current) => ({ ...current, score: addHand(current.score, input) }));
  }

  function subtract(amount: number) {
    setLedger((current) => ({ ...current, score: subtractPoints(current.score, amount) }));
  }

  function finish() {
    setLedger((current) => finishGame(current, new Date().toISOString()));
  }

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    document.title = "Счёт ричи";
    document.documentElement.lang = "ru";
    document.body.style.backgroundColor = colors.bg;
    document.documentElement.style.backgroundColor = colors.bg;
  }, []);

  return (
    <SafeAreaProvider style={styles.provider}>
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        <View style={styles.column}>
          <Text style={styles.appTitle}>Счёт ричи</Text>
          <View style={styles.switchRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: screen === "counter" }}
              onPress={() => setScreen("counter")}
              style={[styles.switchButton, screen === "counter" && styles.switchOn]}
              testID="screen-counter"
            >
              <Text style={[styles.switchText, screen === "counter" && styles.switchTextOn]}>Счётчик</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: screen === "hand" }}
              onPress={() => setScreen("hand")}
              style={[styles.switchButton, screen === "hand" && styles.switchOn]}
              testID="screen-hand"
            >
              <Text style={[styles.switchText, screen === "hand" && styles.switchTextOn]}>Рука</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: screen === "game" }}
              onPress={() => setScreen("game")}
              style={[styles.switchButton, screen === "game" && styles.switchOn]}
              testID="screen-game"
            >
              <Text style={[styles.switchText, screen === "game" && styles.switchTextOn]}>Игра</Text>
            </Pressable>
          </View>
          <View
            style={[styles.fill, screen !== "counter" && styles.hidden]}
            pointerEvents={screen === "counter" ? "auto" : "none"}
          >
            <Scorer canSave={ready} onSave={record} />
          </View>
          <View
            style={[styles.fill, screen !== "hand" && styles.hidden]}
            pointerEvents={screen === "hand" ? "auto" : "none"}
          >
            <HandBuilder canSave={ready} onSave={record} />
          </View>
          <View
            style={[styles.fill, screen !== "game" && styles.hidden]}
            pointerEvents={screen === "game" ? "auto" : "none"}
          >
            <GameTable ledger={ledger} onSubtract={subtract} onFinish={finish} />
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function Scorer({ canSave, onSave }: { canSave: boolean; onSave: (input: SettleInput) => void }) {
  const [extraHan, setExtraHan] = useState(0);
  const [fu, setFu] = useState(DEFAULT_FU);
  const [kans, setKans] = useState<KanCounts>(ZERO_KANS);
  const [winner, setWinner] = useState<Winner>("nonDealer");
  const [winBy, setWinBy] = useState<WinBy>("ron");
  const [closed, setClosed] = useState(true);
  const [selected, setSelected] = useState<YakuId[]>([]);
  const [counters, setCounters] = useState<HanCounters>(ZERO_COUNTERS);
  const [sticks, setSticks] = useState(0);
  const [honba, setHonba] = useState(0);
  const [saved, setSaved] = useState(false);

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
    kans,
  });
  const award = score ? awardView(score, sticks, honba) : null;
  const badge = score ? limitLabel(score) : null;
  const addedKanFu = kanFu(kans);
  const fuText =
    score && addedKanFu > 0 && yakuSum.yakuman === 0 ? `${score.fu} фу` : fuLabel(fuDecision);

  function shiftKan(key: keyof KanCounts, delta: -1 | 1) {
    setKans((current) => changeKan(current, key, delta));
    setSaved(false);
  }

  function saveHand() {
    if (!score || !canSave) return;
    onSave({ winBy, hand: score, sticks, honba });
    setSticks(0);
    setHonba(0);
    setSaved(true);
  }

  return (
    <View style={styles.fill}>
      <View style={styles.top}>
        <View style={styles.result} accessibilityRole="summary">
            <Text style={styles.eyebrow}>Общие очки</Text>
            <Text
              style={score ? styles.points : styles.pointsEmpty}
              testID="total-points"
              accessibilityLiveRegion="polite"
            >
              {award ? formatPoints(award.total) : "—"}
            </Text>
            <View style={styles.lineSlot}>
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
            <View style={styles.lineSlot}>
              {fuDecision.status === "implied" && yakuSum.yakuman === 0 ? (
                <Text style={styles.yakuHan} testID="fu-from-yaku" numberOfLines={1}>
                  Фу из яку: {fuDecision.fu}
                </Text>
              ) : null}
              {fuDecision.status === "conflict" && yakuSum.yakuman === 0 ? (
                <Text style={styles.yakuHan} testID="fu-conflict" numberOfLines={1}>
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
              {(award?.lines ?? ["", ""]).slice(0, 3).map((line, index) => (
                <Text key={`${index}-${line}`} style={styles.pay} numberOfLines={1}>
                  {line}
                </Text>
              ))}
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <CountRow
              label="Хан"
              value={extraHan}
              testID="han"
              onDecrease={() => setExtraHan((current) => changeExtraHan(current, -1))}
              onIncrease={() => setExtraHan((current) => changeExtraHan(current, 1))}
            />
            {han >= 13 && yakuSum.yakuman === 0 ? (
              <Hint>13 и больше хан — кадзоэ-якуман, очки одного якмана.</Hint>
            ) : han >= 5 && yakuSum.yakuman === 0 ? (
              <Hint>С 5 хан число фу на очки не влияет.</Hint>
            ) : (
              <Hint>Плюс к хан из яку. Если яку не выбраны, это весь хан.</Hint>
            )}
          </View>

          <View style={styles.section}>
            <CountRow
              label="Фу"
              value={fu}
              testID="fu"
              onDecrease={() => setFu((current) => changeFu(current, -1))}
              onIncrease={() => setFu((current) => changeFu(current, 1))}
            />
            <Hint>По умолчанию 30. Ноль берёт фу у пинфу и тиитойцу. Каны сюда не входят.</Hint>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Каны</Text>
            <CountRow
              label="Открытый, простая"
              value={kans.openSimple}
              testID="kan-open-simple"
              onDecrease={() => shiftKan("openSimple", -1)}
              onIncrease={() => shiftKan("openSimple", 1)}
            />
            <CountRow
              label="Открытый, 1·9·честь"
              value={kans.openHonor}
              testID="kan-open-honor"
              onDecrease={() => shiftKan("openHonor", -1)}
              onIncrease={() => shiftKan("openHonor", 1)}
            />
            <CountRow
              label="Закрытый, простая"
              value={kans.closedSimple}
              testID="kan-closed-simple"
              onDecrease={() => shiftKan("closedSimple", -1)}
              onIncrease={() => shiftKan("closedSimple", 1)}
            />
            <CountRow
              label="Закрытый, 1·9·честь"
              value={kans.closedHonor}
              testID="kan-closed-honor"
              onDecrease={() => shiftKan("closedHonor", -1)}
              onIncrease={() => shiftKan("closedHonor", 1)}
            />
            <Hint>
              {addedKanFu > 0
                ? `Каны добавляют ${addedKanFu} фу и округляют сумму до десятка.`
                : "Открытый кан 8 или 16 фу, закрытый 16 или 32. Вместе не больше четырёх."}
            </Hint>
          </View>

          <Section title="Игрок">
            <View style={styles.pair}>
              <BlockChoice
                label="Не-дилер"
                selected={winner === "nonDealer"}
                onPress={() => {
                  setWinner("nonDealer");
                  setSaved(false);
                }}
                testID="winner-non-dealer"
              />
              <BlockChoice
                label="Дилер"
                selected={winner === "dealer"}
                onPress={() => {
                  setWinner("dealer");
                  setSaved(false);
                }}
                testID="winner-dealer"
              />
            </View>
          </Section>

          <Section title="Победа">
            <View style={styles.pair}>
              <BlockChoice
                label="Рон"
                selected={winBy === "ron"}
                onPress={() => {
                  setWinBy("ron");
                  setSaved(false);
                }}
                testID="win-ron"
              />
              <BlockChoice
                label="Цумо"
                selected={winBy === "tsumo"}
                onPress={() => {
                  setWinBy("tsumo");
                  setSaved(false);
                }}
                testID="win-tsumo"
              />
            </View>
            <View style={styles.pair}>
              <BlockChoice
                label="Закрытая"
                selected={closed}
                onPress={() => setClosed(true)}
                testID="hand-closed"
              />
              <BlockChoice
                label="Открытая"
                selected={!closed}
                onPress={() => {
                  setClosed(false);
                  setSelected((current) => dropClosedOnly(current));
                }}
                testID="hand-open"
              />
            </View>
          </Section>

          <Section title="Стол">
            <BonusFields
              sticks={sticks}
              honba={honba}
              onSticks={(value) => {
                setSticks(value);
                setSaved(false);
              }}
              onHonba={(value) => {
                setHonba(value);
                setSaved(false);
              }}
              idPrefix="counter"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Записать в партию"
              accessibilityState={{ disabled: !score || !canSave }}
              disabled={!score || !canSave}
              testID="counter-save"
              onPress={saveHand}
              style={({ pressed }) => [
                styles.save,
                (!score || !canSave) && styles.clearDisabled,
                pressed && score && canSave && styles.chipPressed,
              ]}
            >
              <Text style={styles.saveText}>В партию</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Сбросить яку"
              accessibilityState={{ disabled: !yakuSum.active }}
              testID="yaku-clear"
              disabled={!yakuSum.active}
              onPress={() => {
                setSelected([]);
                setCounters(ZERO_COUNTERS);
              }}
              style={({ pressed }) => [
                styles.clear,
                !yakuSum.active && styles.clearDisabled,
                pressed && yakuSum.active && styles.chipPressed,
              ]}
            >
              <Text style={styles.clearText}>Сбросить яку</Text>
            </Pressable>
            {saved ? (
              <Text style={styles.hint} testID="counter-saved">
                Записано в партию
              </Text>
            ) : null}
          </Section>

          <Section title="Яку">
            <YakuPicker
              closed={closed}
              selected={selected}
              onToggle={(id) => setSelected((current) => toggleYaku(current, id))}
              counters={counters}
              onCounter={(id, value) => setCounters((current) => ({ ...current, [id]: value }))}
              sum={yakuSum}
            />
          </Section>

          <Text style={styles.footer}>
            Обычный счёт, без кириагэ-манган. Риити и дабури-риити не складываются.
          </Text>
        </ScrollView>
    </View>
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
  fill: {
    flex: 1,
  },
  hidden: {
    display: "none",
  },
  appTitle: {
    color: colors.gold,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    paddingTop: 8,
  },
  switchRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  switchButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.chipEdge,
    backgroundColor: colors.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  switchOn: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  switchText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  switchTextOn: {
    color: colors.ink,
  },
  top: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
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
    paddingTop: 4,
    paddingBottom: 4,
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
    lineHeight: 66,
    fontVariant: ["tabular-nums"],
  },
  pointsEmpty: {
    color: colors.muted,
    fontSize: 64,
    fontWeight: "800",
    lineHeight: 66,
  },
  lineSlot: {
    height: 18,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  badge: {
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  badgeText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 16,
  },
  meta: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  who: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 18,
  },
  detailSlot: {
    height: 18,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  yakuHan: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 18,
    textAlign: "center",
  },
  paySlot: {
    minHeight: 40,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  pay: {
    color: colors.pay,
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 20,
    textAlign: "center",
  },
  clear: {
    alignSelf: "stretch",
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  clearDisabled: {
    opacity: 0.4,
  },
  clearText: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 22,
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
  save: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gold,
  },
  saveText: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
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
