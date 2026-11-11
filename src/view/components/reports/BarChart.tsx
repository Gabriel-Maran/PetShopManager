import { View, Text, StyleSheet, ScrollView } from "react-native";
import { ThemeColors, useTheme, useThemedStyles } from "../../theme/ThemeProvider";
import { formatValue } from "../../../utils/formatters/numberFormat";
import { A11Y_LABELS } from "../../../globals/accessibilityLabels";
import type { BarChartItem } from "../../../utils/reports/charts";
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from "../../theme/tokens";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface BarChartProps {
  data: BarChartItem[];
  title?: string;
  suffix?: string;
  color?: string;
  height?: number;
  /** Rótulos girados em -40°, para textos longos. */
  verticalLabels?: boolean;
  /** Rótulos invertidos: o sufixo e o valor formatado em ordem contrária. */
  invertLabelY?: boolean;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function BarChart({
  data,
  title,
  suffix = "",
  color,
  height = 180,
  verticalLabels = false,
  invertLabelY = false,
}: BarChartProps) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();

  if (!data || data.length === 0) {
    return (
      <View style={s.empty}>
        <Text style={s.emptyTxt}>Sem dados para exibir</Text>
      </View>
    );
  }

  const maxY = Math.max(...data.map((d) => d.y));

  // Reserva espaço extra embaixo para o texto rotacionado
  const labelAreaHeight = verticalLabels ? 64 : 36;

  return (
    <View style={s.card}>
      {title && <Text style={s.title}>{title}</Text>}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, verticalLabels && { gap: SPACING[20] }]}
      >
        {data.map((item, index) => {
          const ratio = maxY > 0 ? item.y / maxY : 0;
          const barHeight = Math.max(ratio * height, item.y > 0 ? 4 : 0);
          const isMax = item.y === maxY && maxY > 0;
          const value = formatValue(item.y);
          const valueWithSuffix = !suffix
            ? value
            : invertLabelY
              ? `${value} ${suffix}`
              : `${suffix} ${value}`;

          return (
            // Cada barra é lida inteira, como "Segunda: 12 pets", e não em pedaços soltos.
            <View
              key={index}
              accessible
              accessibilityLabel={A11Y_LABELS.chartBar(item.x, valueWithSuffix)}
              style={[s.barWrapper, verticalLabels && { minWidth: 36, maxWidth: 52 }]}
            >
              {/* Valor no topo */}
              <Text style={[s.valueLabel, isMax && s.valueLabelMax]}>
                {invertLabelY ? (
                  <>
                    {value}
                    {suffix && <Text style={s.suffix}> {suffix}</Text>}
                  </>
                ) : (
                  <>
                    {suffix && <Text style={s.suffix}>{suffix} </Text>}
                    {value}
                  </>
                )}
              </Text>

              {/* Área da barra */}
              <View style={[s.barArea, { height }]}>
                <View
                  style={[
                    s.bar,
                    {
                      height: barHeight,
                      backgroundColor:
                        color ?? (isMax ? colors.CHART_BAR_HIGHLIGHT : colors.CHART_BAR),
                    },
                  ]}
                />
              </View>

              {/* Label X — área de altura fixa para não deslocar as barras */}
              <View style={[s.labelArea, { height: labelAreaHeight }]}>
                <Text
                  style={[s.xLabel, verticalLabels && s.xLabelVertical]}
                  numberOfLines={verticalLabels ? 1 : 2}
                >
                  {item.x}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Linha de base */}
      <View style={s.baseline} />
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      borderRadius: RADIUS[14],
      padding: SPACING[16],
      alignSelf: "flex-start",
    },
    scroll: {
      flexGrow: 0,
    },
    title: {
      fontSize: FONT_SIZE.BODY,
      fontWeight: FONT_WEIGHT.SEMIBOLD,
      color: colors.TEXT_PRIMARY,
      marginBottom: SPACING[16],
    },
    scrollContent: {
      flexDirection: "row",
      justifyContent: "space-evenly",
      minWidth: "100%",
      paddingHorizontal: SPACING[8],
      gap: SPACING[15],
    },
    barWrapper: {
      alignItems: "center",
      flex: 1,
      minWidth: 44,
      maxWidth: 80,
    },
    valueLabel: {
      fontSize: FONT_SIZE.CAPTION,
      fontWeight: FONT_WEIGHT.MEDIUM,
      color: colors.TEXT_MUTED,
      marginBottom: SPACING[4],
      textAlign: "justify",
    },
    valueLabelMax: {
      color: colors.CHART_TEXT_HIGHLIGHT,
      fontWeight: FONT_WEIGHT.BOLD,
    },
    suffix: {
      fontSize: FONT_SIZE.OVERLINE,
    },
    barArea: {
      justifyContent: "flex-end",
      width: "100%",
    },
    bar: {
      width: "100%",
      borderRadius: RADIUS[6],
    },
    labelArea: {
      width: "100%",
      alignItems: "center",
      justifyContent: "flex-start",
      overflow: "visible",
      marginTop: SPACING[6],
    },
    xLabel: {
      fontSize: FONT_SIZE.CAPTION,
      color: colors.TEXT_MUTED,
      textAlign: "center",
      maxWidth: 60,
    },
    xLabelVertical: {
      transform: [{ rotate: "-40deg" }, { translateX: -10 }],
      textAlign: "left",
      maxWidth: 80,
    },
    baseline: {
      height: 1,
      backgroundColor: colors.BORDER_MID,
      marginTop: SPACING[4],
      marginHorizontal: SPACING[2],
    },
    empty: {
      padding: SPACING[24],
      alignItems: "center",
    },
    emptyTxt: {
      color: colors.TEXT_MUTED,
      fontSize: FONT_SIZE.BODY,
    },
  });
