import { View, Text, StyleSheet, ScrollView } from "react-native";
import { ThemeColors, useThemedStyles } from "../../Themes/ThemeProvider";
import { formatValue } from "../../../utils/formaterHelper";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface BarChartItem {
  x: string;
  y: number;
}

interface BarChartProps {
  data: BarChartItem[];
  title?: string;
  suffix?: string;
  color?: string;
  height?: number;
  verticalLabels?: boolean; // ← labels rotacionadas -40°, ideal para textos longos
  invertLabelY?: boolean; // ← labels invertidas (suffix e formatted value em ordem contrária)
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
        contentContainerStyle={[s.scrollContent, verticalLabels && { gap: 20 }]}
      >
        {data.map((item, index) => {
          const ratio = maxY > 0 ? item.y / maxY : 0;
          const barHeight = Math.max(ratio * height, item.y > 0 ? 4 : 0);
          const isMax = item.y === maxY && maxY > 0;

          return (
            <View
              key={index}
              style={[
                s.barWrapper,
                verticalLabels && { minWidth: 36, maxWidth: 52 },
              ]}
            >
              {/* Valor no topo */}
              <Text style={[s.valueLabel, isMax && s.valueLabelMax]}>
                {invertLabelY ? (
                  <>
                    {formatValue(item.y)}
                    {suffix && <Text style={s.suffix}> {suffix}</Text>}
                  </>
                ) : (
                  <>
                    {suffix && <Text style={s.suffix}>{suffix} </Text>}
                    {formatValue(item.y)}
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
                      backgroundColor: color ?? (isMax ? "#185FA5" : "#85B7EB"),
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
      borderRadius: 14,
      padding: 16,
      alignSelf: "flex-start",
    },
    scroll: {
      flexGrow: 0,
    },
    title: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.TEXT_PRIMARY,
      marginBottom: 16,
    },
    scrollContent: {
      flexDirection: "row",
      justifyContent: "space-evenly",
      minWidth: "100%",
      paddingHorizontal: 8,
      gap: 15,
    },
    barWrapper: {
      alignItems: "center",
      flex: 1,
      minWidth: 44,
      maxWidth: 80,
    },
    valueLabel: {
      fontSize: 11,
      fontWeight: "500",
      color: colors.TEXT_MUTED,
      marginBottom: 4,
      textAlign: "justify",
    },
    valueLabelMax: {
      color: "#185FA5",
      fontWeight: "700",
    },
    suffix: {
      fontSize: 10,
    },
    barArea: {
      justifyContent: "flex-end",
      width: "100%",
    },
    bar: {
      width: "100%",
      borderRadius: 6,
    },
    labelArea: {
      width: "100%",
      alignItems: "center",
      justifyContent: "flex-start",
      overflow: "visible",
      marginTop: 6,
    },
    xLabel: {
      fontSize: 11,
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
      marginTop: 4,
      marginHorizontal: 2,
    },
    empty: {
      padding: 24,
      alignItems: "center",
    },
    emptyTxt: {
      color: colors.TEXT_MUTED,
      fontSize: 14,
    },
  });
