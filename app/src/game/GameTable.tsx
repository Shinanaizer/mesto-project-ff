import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { formatPoints } from "../scoring/score";
import { STARTING_SCORE, WRITE_OFF_DEFAULT, nextWriteOff, type Ledger } from "./table";

const colors = {
  text: "#f7f4ec",
  muted: "#b7c9bf",
  chip: "#21493b",
  chipEdge: "#3d6b58",
  gold: "#e6b34e",
  ink: "#1b1408",
  card: "#18352a",
};

const WRITE_OFF_STEPS = [1000, 100] as const;

export function GameTable({
  ledger,
  onSubtract,
  onFinish,
}: {
  ledger: Ledger;
  onSubtract: (amount: number) => void;
  onFinish: () => void;
}) {
  const [amount, setAmount] = useState(WRITE_OFF_DEFAULT);

  function shift(delta: number) {
    setAmount((current) => nextWriteOff(current, delta));
  }

  function writeOff() {
    if (amount < 1) return;
    onSubtract(amount);
    setAmount(WRITE_OFF_DEFAULT);
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Партия</Text>
      <Text style={styles.hint}>Ваш счёт. Старт {formatPoints(STARTING_SCORE)}.</Text>
      <View style={styles.card}>
        <Text style={styles.points} testID="game-score">
          {formatPoints(ledger.score)}
        </Text>
      </View>

      <Text style={styles.title}>Списание</Text>
      <Text style={styles.hint}>Проигрыш не из сохранённой руки. Кнопки 1 000 и 100 складываются в одну сумму.</Text>
      <View style={styles.amountCard}>
        <Text style={styles.amount} testID="game-amount">
          {formatPoints(amount)}
        </Text>
      </View>
      {WRITE_OFF_STEPS.map((step) => {
        const canMinus = nextWriteOff(amount, -step) !== amount;
        const canPlus = nextWriteOff(amount, step) !== amount;
        return (
          <View key={step} style={styles.pair}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Минус ${formatPoints(step)}`}
              accessibilityState={{ disabled: !canMinus }}
              disabled={!canMinus}
              testID={`game-minus-${step}`}
              onPress={() => shift(-step)}
              style={[styles.step, !canMinus && styles.stepOff]}
            >
              <Text style={styles.stepText}>−{formatPoints(step)}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Плюс ${formatPoints(step)}`}
              accessibilityState={{ disabled: !canPlus }}
              disabled={!canPlus}
              testID={`game-plus-${step}`}
              onPress={() => shift(step)}
              style={[styles.step, !canPlus && styles.stepOff]}
            >
              <Text style={styles.stepText}>+{formatPoints(step)}</Text>
            </Pressable>
          </View>
        );
      })}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Списать ${formatPoints(amount)}`}
        accessibilityState={{ disabled: amount < 1 }}
        disabled={amount < 1}
        testID="game-subtract"
        onPress={writeOff}
        style={[styles.action, amount < 1 && styles.stepOff]}
      >
        <Text style={styles.actionText}>Списать</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Закончить партию"
        testID="game-finish"
        onPress={onFinish}
        style={styles.finish}
      >
        <Text style={styles.finishText}>Закончить партию</Text>
      </Pressable>
      <Text style={styles.hint}>Счёт уходит в список. Следующая партия снова с 25 000.</Text>

      <Text style={styles.title}>Прошлые партии</Text>
      {ledger.past.length === 0 ? <Text style={styles.hint}>Пока нет.</Text> : null}
      {ledger.past.map((game, index) => (
        <View key={`${game.date}-${index}`} style={styles.past} testID="game-past">
          <Text style={styles.pastDate}>{formatWhen(game.date)}</Text>
          <Text style={styles.pastScores}>{formatPoints(game.score)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
    gap: 10,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  hint: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  points: {
    color: colors.gold,
    fontSize: 40,
    fontWeight: "800",
  },
  amountCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  amount: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
  },
  pair: {
    flexDirection: "row",
    gap: 8,
  },
  step: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.chip,
    borderWidth: 1,
    borderColor: colors.chipEdge,
    alignItems: "center",
    justifyContent: "center",
  },
  stepOff: {
    opacity: 0.4,
  },
  stepText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  action: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.chip,
  },
  actionText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 18,
  },
  finish: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gold,
  },
  finishText: {
    color: colors.ink,
    fontWeight: "800",
    fontSize: 18,
  },
  past: {
    gap: 2,
  },
  pastDate: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: "700",
  },
  pastScores: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 22,
  },
});
