import { Calendar, LocaleConfig } from "react-native-calendars";
import { StyleSheet, Text, View } from "react-native";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../Themes/ThemeProvider";
import { useEffect, useState, useMemo } from "react";
import { useError } from "../../hooks/useError";

import { Appointment } from "../../model/Appointment";

import { appointmentController } from "../../controller/AppointmentsController";

import { dateToIso, todayIso } from "../../utils/datas";
import { useAgendamentos } from "../contexts/agendamentos";

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

//Configura o calendário para usar o locale pt-br
LocaleConfig.defaultLocale = "pt-br";

export default function Calendario() {
  const { colors } = useTheme();
  const { showError } = useError();

  const {
    dateSelected,
    setDateSelected,
    mesSelecionado,
    setMesSelecionado,
    datasComAgendamento,
    setDatasComAgendamento,
  } = useAgendamentos();

  const pegarMesEAno = () => {
    const data = mesSelecionado || dateSelected;
    const [ano, mes] = data.split("-");

    return {
      ano: Number(ano),
      mes: Number(mes),
    };
  };

  function pegarIntervaloMes() {
    const { mes, ano } = pegarMesEAno();
    // No Date, o mês vai de 0 a 11: (ano, mes - 1, 1) é o dia 1 do mês, e o dia 0 do mês seguinte,
    // (ano, mes, 0), é o último dia dele (28, 29, 30 ou 31).
    return {
      inicio: dateToIso(new Date(ano, mes - 1, 1)),
      fim: dateToIso(new Date(ano, mes, 0)),
    };
  }

  useEffect(() => {
    const { inicio, fim } = pegarIntervaloMes();
    appointmentController
      .getAppointmentsByDateRange(inicio, fim)
      //.getAppointmentsByDateRangeNotDone(inicio, fim)
      .then(setDatasComAgendamento)
      .catch(showError);
  }, [mesSelecionado, dateSelected]);

  // useMemo pra guardar as datas
  const datasMarcadas = useMemo(() => {
    const marks = datasComAgendamento.reduce(
      (acc, appointment) => {
        acc[appointment.data] = {
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
    datasComAgendamento,
    dateSelected,
    colors.PRIMARY,
    colors.PRIMARY_CONTRAST,
  ]);
  const s = useThemedStyles(styles);

  const hoje = todayIso();

  const isHojeSelecionado = dateSelected === hoje;

  return (
    <View style={s.completeCalendar}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold",
          color: colors.TEXT_PRIMARY,
        }}
      >
        Calendário de Agendamentos
      </Text>
      <Calendar
        current={mesSelecionado || dateSelected}
        style={s.calendar}
        onDayPress={(day) => {
          setDateSelected(day.dateString);
        }}
        onMonthChange={(month) => {
          setMesSelecionado(month.dateString);
          setDateSelected(month.dateString);
        }}
        markingType="custom"
        markedDates={{
          ...datasMarcadas,

          [hoje]: {
            ...datasMarcadas[hoje],
            marked: datasMarcadas[hoje]?.marked ?? true,
            dotColor: "#FFFFFF",
            selectedDotColor: "#FFFFFF",
            selected: true,
            customStyles: {
              container: {
                width: 40,
                height: 40,
                backgroundColor: colors.PRIMARY_CONTRAST,
                borderRadius: 2,
                alignItems: "center",
                justifyContent: "center",
                margin: 0,
                padding: 0,
              },
              text: {
                color: "#FFFFFF",
                fontWeight: "bold",
                includeFontPadding: false,
                textAlignVertical: "center",
              },
            },
          },

          ...(!isHojeSelecionado && {
            [dateSelected]: {
              ...datasMarcadas[dateSelected],
              selected: true,
              customStyles: {
                container: {
                  width: 40,
                  height: 40,
                  borderColor: colors.PRIMARY_CONTRAST,
                  backgroundColor: "transparent",
                  borderWidth: 2.5,
                  borderRadius: 2,
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
            textMonthFontSize: 18,
            textMonthFontWeight: "600",
            monthTextColor: colors.TEXT_SECONDARY,

            // Cabeçalho (Dom, Seg, Ter...)
            textDayHeaderFontSize: 13,
            textSectionTitleColor: colors.TEXT_PRIMARY,

            // Números dos dias
            textDayFontSize: 18,
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
                fontSize: 18,
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
      padding: 10,
      borderColor: colors.BORDER_STRONG,
      borderWidth: 1,
      borderRadius: 15,
    },
  });
