import { Pressable, StyleSheet, Text, View } from "react-native";
import { clampBonus } from "./table";

const colors = {
  text: "#f7f4ec",
  muted: "#b7c9bf",
  chip: "#21493b",
  chipEdge: "#3d6b58",
};

export function BonusFields({
  sticks,
  honba,
  onSticks,
  onHonba,
  idPrefix,
}: {
  sticks: number;
  honba: number;
  onSticks: (value: number) => void;
  onHonba: (value: number) => void;
  idPrefix: string;
}) {
  return (
    <View style={styles.wrap}>
      <CountRow
        label="Палочки"
        value={sticks}
        testID={`${idPrefix}-sticks`}
        onDecrease={() => onSticks(clampBonus(sticks - 1))}
        onIncrease={() => onSticks(clampBonus(sticks + 1))}
      />
      <CountRow
        label="Хонба"
        value={honba}
        testID={`${idPrefix}-honba`}
        onDecrease={() => onHonba(clampBonus(honba - 1))}
        onIncrease={() => onHonba(clampBonus(honba + 1))}
      />
      <Text style={styles.hint}>
        Палочка — 1000 к очкам руки. Хонба — 300: при роне одной суммой, при цумо по 100.
      </Text>
    </View>
  );
}

export function CountRow({
  label,
  value,
  testID,
  onDecrease,
  onIncrease,
}: {
  label: string;
  value: number;
  testID: string;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} меньше`}
          testID={`${testID}-dec`}
          onPress={onDecrease}
          style={styles.step}
        >
          <Text style={styles.stepText}>−</Text>
        </Pressable>
        <Text style={styles.count} testID={`${testID}-count`}>
          {value}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} больше`}
          testID={`${testID}-inc`}
          onPress={onIncrease}
          style={styles.step}
        >
          <Text style={styles.stepText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
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
  count: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    minWidth: 28,
    textAlign: "center",
  },
  hint: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 18,
  },
});
