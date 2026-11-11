import { Calendar, LocaleConfig } from "react-native-calendars";
import { StyleSheet, Text, View } from "react-native";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../theme/ThemeProvider";
import { useEffect, useMemo } from "react";
import { useError } from "../../hooks/useError";

import { appointmentController } from "../../controller/AppointmentsController";

import { dateToIso, todayIso } from "../../utils/dates";
import { useCalendar } from "../contexts/CalendarContext";
import { FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from "../theme/tokens";

// Configuração do calendário para português do Brasil
LocaleConfig.locales["pt-br"] = {
  monthNames: [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ],
  monthNamesShort: [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ],
  dayNames: [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ],
  dayNamesShort: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
  today: "Hoje",
};

LocaleConfig.defaultLocale = "pt-br";

export default function AppointmentCalendar() {
  const { colors } = useTheme();
  const { showError } = useError();

  const {
    dateSelected,
    setDateSelected,
    selectedMonth,
    setSelectedMonth,
    datedAppointments,
    setDatedAppointments,
  } = useCalendar();

  const monthAndYearOf = () => {
    const data = selectedMonth || dateSelected;
    const [year, month] = data.split("-");

    return {
      year: Number(year),
      month: Number(month),
    };
  };

  function monthRangeOf() {
    const { month, year } = monthAndYearOf();
    // No Date, o mês vai de 0 a 11: (ano, mes - 1, 1) é o dia 1 do mês, e o dia 0 do mês seguinte,
    // (ano, mes, 0), é o último dia dele (28, 29, 30 ou 31).
    return {
      rangeStart: dateToIso(new Date(year, month - 1, 1)),
      rangeEnd: dateToIso(new Date(year, month, 0)),
    };
  }

  useEffect(() => {
    const { rangeStart, rangeEnd } = monthRangeOf();
    appointmentController
      .getAppointmentsByDateRange(rangeStart, rangeEnd)
      .then(setDatedAppointments)
      .catch(showError);
  }, [selectedMonth, dateSelected]);

  const markedDays = useMemo(() => {
    const marks = datedAppointments.reduce(
      (acc, appointment) => {
        acc[appointment.date] = {
          marked: true,
          dotColor: colors.PRIMARY_CONTRAST,
        };

        return acc;
      },
      {} as Record<string, any>,
    );

    marks[dateSelected] = {
      ...(marks[dateSelected] ?? {}),
      selected: true,
      selectedColor: colors.PRIMARY_CONTRAST,
    };

    return marks;
  }, [
    datedAppointments,
    dateSelected,
    colors.PRIMARY,
    colors.PRIMARY_CONTRAST,
  ]);
  const s = useThemedStyles(styles);

  const today = todayIso();

  const isTodaySelected = dateSelected === today;

  return (
    <View style={s.completeCalendar}>
      <Text
        accessibilityRole="header"
        style={{
          fontSize: FONT_SIZE.TITLE,
          fontWeight: FONT_WEIGHT.BOLD,
          color: colors.TEXT_PRIMARY,
        }}
      >
        Calendário de Agendamentos
      </Text>
      <Calendar
        current={selectedMonth || dateSelected}
        style={s.calendar}
        onDayPress={(day) => {
          setDateSelected(day.dateString);
        }}
        onMonthChange={(month) => {
          setSelectedMonth(month.dateString);
          setDateSelected(month.dateString);
        }}
        markingType="custom"
        markedDates={{
          ...markedDays,

          [today]: {
            ...markedDays[today],
            marked: markedDays[today]?.marked ?? true,
            dotColor: colors.BACKGROUND,
            selectedDotColor: colors.BACKGROUND,
            selected: true,
            customStyles: {
              container: {
                width: 40,
                height: 40,
                backgroundColor: colors.PRIMARY_CONTRAST,
                borderRadius: RADIUS[2],
                alignItems: "center",
                justifyContent: "center",
                margin: 0,
                padding: 0,
              },
              text: {
                // A cor do fundo sobre o teal cheio: branco no claro, escuro no escuro; passa 4,5:1 nos dois.
                color: colors.BACKGROUND,
                fontWeight: FONT_WEIGHT.BOLD,
                includeFontPadding: false,
                textAlignVertical: "center",
              },
            },
          },

          ...(!isTodaySelected && {
            [dateSelected]: {
              ...markedDays[dateSelected],
              selected: true,
              customStyles: {
                container: {
                  width: 40,
                  height: 40,
                  borderColor: colors.PRIMARY_CONTRAST,
                  backgroundColor: colors.TRANSPARENT,
                  borderWidth: 2.5,
                  borderRadius: RADIUS[2],
                  alignItems: "center",
                  justifyContent: "center",
                  margin: 0,
                  padding: 0,
                },
                text: {
                  color: colors.TEXT_SECONDARY,
                  includeFontPadding: false,
                  textAlignVertical: "center",
                },
              },
            },
          }),
        }}
        theme={
          {
            // Cores gerais
            backgroundColor: colors.BACKGROUND,
            calendarBackground: colors.BACKGROUND,

            // Texto do mês/ano no topo
            textMonthFontSize: FONT_SIZE.TITLE_SMALL,
            textMonthFontWeight: FONT_WEIGHT.SEMIBOLD,
            monthTextColor: colors.TEXT_SECONDARY,

            // Cabeçalho (Dom, Seg, Ter...)
            textDayHeaderFontSize: FONT_SIZE.BODY_SMALL,
            textSectionTitleColor: colors.TEXT_PRIMARY,

            // Números dos dias
            textDayFontSize: FONT_SIZE.TITLE_SMALL,
            dayTextColor: colors.TEXT_SECONDARY,

            // Dia selecionado
            selectedDayBackgroundColor: colors.PRIMARY_CONTRAST,
            selectedDayTextColor: colors.BACKGROUND,

            // Hoje
            todayTextColor: colors.PRIMARY_CONTRAST,

            // Dias desabilitados
            textDisabledColor: colors.THIRD_BACKGROUND,

            // Setas de navegação
            arrowColor: colors.PRIMARY_CONTRAST,

            "stylesheet.calendar.main": {
              week: {
                flexDirection: "row",
                justifyContent: "space-around",
              },
            },

            "stylesheet.day.basic": {
              base: {
                width: 42,
                height: 42,
                alignItems: "center",
                justifyContent: "center",
              },
              text: {
                marginTop: 0,
                fontSize: FONT_SIZE.TITLE_SMALL,
                color: colors.TEXT_SECONDARY,
                includeFontPadding: false,
                textAlignVertical: "center",
              },
              selectedDot: {
                backgroundColor: colors.PRIMARY_CONTRAST,
              },
            },
          } as any
        }
      />
    </View>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    calendar: {
      width: "100%",
    },
    completeCalendar: {
      backgroundColor: colors.BACKGROUND,
      width: "100%",
      justifyContent: "center",
      alignSelf: "center",
      padding: SPACING[10],
      borderColor: colors.BORDER_STRONG,
      borderWidth: 1,
      borderRadius: RADIUS[15],
    },
  });
