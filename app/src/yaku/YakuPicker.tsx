import { Pressable, StyleSheet, Text, View } from "react-native";
import { COUNTERS, type HanCounters, type YakuId } from "./catalog";
import {
  ORDINARY_YAKU,
  YAKUMAN_YAKU,
  clampCounter,
  yakuHanText,
  yakuShowsBothHan,
  type YakuSum,
} from "./sum";

const colors = {
  text: "#f7f4ec",
  muted: "#b7c9bf",
  chip: "#21493b",
  chipEdge: "#3d6b58",
  gold: "#e6b34e",
  ink: "#1b1408",
  row: "#17352a",
};

export function YakuPicker({
  closed,
  selected,
  onToggle,
  counters,
  onCounter,
  sum,
}: {
  closed: boolean;
  selected: readonly YakuId[];
  onToggle: (id: YakuId) => void;
  counters: HanCounters;
  onCounter: (id: keyof HanCounters, value: number) => void;
  sum: YakuSum;
}) {
  const selectedSet = new Set(selected);

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>
        {sum.active
          ? sum.yakuman > 0
            ? "Якуман задаёт лимит. Счётчик хан и дора к нему не прибавляются."
            : `Из яку: ${sum.han}. Счётчик хан прибавляется сверху.`
          : "Отметьте яку. Их хан сложится отдельно от счётчика хан."}
      </Text>

      <Text style={styles.group}>Яку</Text>
      {ORDINARY_YAKU.map((yaku) => (
        <YakuRow
          key={yaku.id}
          id={yaku.id}
          name={yaku.name}
          description={yaku.description}
          selected={selectedSet.has(yaku.id)}
          disabled={!closed && yaku.closedOnly}
          bothHan={yakuShowsBothHan(yaku.id)}
          closedOnly={yaku.closedOnly}
          onPress={() => onToggle(yaku.id)}
        />
      ))}

      <Text style={styles.group}>Якуман</Text>
      {YAKUMAN_YAKU.map((yaku) => (
        <YakuRow
          key={yaku.id}
          id={yaku.id}
          name={yaku.name}
          description={yaku.description}
          selected={selectedSet.has(yaku.id)}
          disabled={!closed && yaku.closedOnly}
          bothHan={false}
          closedOnly={yaku.closedOnly}
          onPress={() => onToggle(yaku.id)}
        />
      ))}

      <Text style={styles.group}>Якухай и дора</Text>
      {COUNTERS.map((counter) => (
        <View key={counter.id} style={styles.counter}>
          <View style={styles.counterText}>
            <Text style={styles.name}>{counter.name}</Text>
            <Text style={styles.description}>{counter.description}</Text>
          </View>
          <View style={styles.stepper}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${counter.name} меньше`}
              testID={`${counter.id}-dec`}
              onPress={() => onCounter(counter.id, clampCounter(counters[counter.id] - 1))}
              style={({ pressed }) => [styles.step, pressed && styles.pressed]}
            >
              <Text style={styles.stepText}>−</Text>
            </Pressable>
            <Text style={styles.count} testID={`${counter.id}-count`}>
              {counters[counter.id]}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${counter.name} больше`}
              testID={`${counter.id}-inc`}
              onPress={() => onCounter(counter.id, clampCounter(counters[counter.id] + 1))}
              style={({ pressed }) => [styles.step, pressed && styles.pressed]}
            >
              <Text style={styles.stepText}>+</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

function YakuRow({
  id,
  name,
  description,
  selected,
  disabled,
  bothHan,
  closedOnly,
  onPress,
}: {
  id: YakuId;
  name: string;
  description: string;
  selected: boolean;
  disabled: boolean;
  bothHan: boolean;
  closedOnly: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      accessibilityState={{ selected, disabled }}
      testID={`yaku-${id}`}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowOn,
        disabled && styles.rowOff,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View style={styles.rowTop}>
        <Text style={[styles.name, selected && styles.nameOn]}>{name}</Text>
        <View style={[styles.hanPill, selected && styles.hanPillOn]}>
          <Text style={[styles.hanText, selected && styles.hanTextOn]}>{yakuHanText(id)}</Text>
        </View>
      </View>
      <Text style={[styles.description, selected && styles.descriptionOn]}>{description}</Text>
      {bothHan ? (
        <Text style={[styles.note, selected && styles.descriptionOn]}>Закрытая / открытая</Text>
      ) : null}
      {closedOnly ? (
        <Text style={[styles.note, selected && styles.descriptionOn]}>Только закрытая рука</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  hint: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  group: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
  },
  row: {
    minHeight: 76,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.chipEdge,
    backgroundColor: colors.row,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  rowOn: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  rowOff: {
    opacity: 0.4,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  name: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  nameOn: {
    color: colors.ink,
  },
  hanPill: {
    minWidth: 76,
    minHeight: 40,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: colors.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  hanPillOn: {
    backgroundColor: colors.ink,
  },
  hanText: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: "800",
  },
  hanTextOn: {
    color: colors.gold,
  },
  description: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 19,
  },
  descriptionOn: {
    color: "#3f3218",
  },
  note: {
    color: colors.muted,
    fontSize: 13,
  },
  counter: {
    minHeight: 76,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.chipEdge,
    backgroundColor: colors.row,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  counterText: {
    flex: 1,
    gap: 4,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  step: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 32,
  },
  count: {
    minWidth: 28,
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  pressed: {
    opacity: 0.75,
  },
});
