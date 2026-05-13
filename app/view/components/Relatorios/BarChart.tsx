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
  suffix?: string; // ex: "R$", "kg", "atend."
  color?: string; // cor das barras (opcional, usa PRIMARY_VARIANT por padrão)
  height?: number; // altura da área do gráfico (padrão: 180)
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function BarChart({
  data,
  title,
  suffix = "",
  color,
  height = 180,
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

  return (
    <View style={s.card}>
      {title && <Text style={s.title}>{title}</Text>}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
      >
        {data.map((item, index) => {
          const ratio = maxY > 0 ? item.y / maxY : 0;
          const barHeight = Math.max(ratio * height, item.y > 0 ? 4 : 0);
          const isMax = item.y === maxY && maxY > 0;

          return (
            <View key={index} style={s.barWrapper}>
              {/* Valor no topo */}
              <Text style={[s.valueLabel, isMax && s.valueLabelMax]}>
                {suffix && <Text style={s.suffix}>{suffix} </Text>}
                {formatValue(item.y)}
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

              {/* Label X */}
              <Text style={s.xLabel} numberOfLines={2}>
                {item.x}
              </Text>
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
      textAlign: "center",
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
      minHeight: 0,
    },
    xLabel: {
      marginTop: 6,
      fontSize: 11,
      color: colors.TEXT_MUTED,
      textAlign: "center",
      maxWidth: 60,
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
