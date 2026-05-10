import { Calendar, LocaleConfig } from "react-native-calendars";
import { StyleSheet, Text, View } from "react-native";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../Themes/ThemeProvider";
import { useEffect, useState } from "react";
import { useError } from "../../hooks/useError";

import { Appointment } from "../../model/Appointment";

import { appointmentController } from "../../controller/AppointmentsController";

import { DataNumberPraStringHifen } from "../../utils/converterData";

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

export default function Calendario({
  setNewDate,
  dateSelected,
}: {
  setNewDate: (date: string) => void;
  dateSelected: string;
}) {
  // new Date().toISOString() -> "2025-04-24T12:34:56.789Z"
  // .split('T')[0] -> "2025-04-24", o [0] pega só a parte da data(ano-mês-dia), sem a parte do horário
  // Isso é só para marcar o dia atual no calendário e inicializar o estado com a data de hoje
  const { colors } = useTheme();
  const { showError } = useError();
  const handleError = (e: unknown) =>
    showError(e instanceof Error ? e.message : "Erro inesperado.");

  const [datasComAgendamento, setDatasComAgendamento] = useState<Appointment[]>(
    [],
  );

  const pegarMesEAno = () => {
    const [ano, mes] = dateSelected.split("-");
    return {
      ano: Number(ano),
      mes: Number(mes),
    };
  };

  function pegarIntervaloMes(ano: number, mes: number) {
    const mesAtual = String(mes).padStart(2, "0");

    const ultimoDia = new Date(ano, mes, 0).getDate();
    const diaFinal = String(ultimoDia).padStart(2, "0");

    return {
      inicio: Number(`${ano}${mesAtual}01`),
      fim: Number(`${ano}${mesAtual}${diaFinal}`),
    };
  }

  useEffect(() => {
    const { mes, ano } = pegarMesEAno();
    const { inicio, fim } = pegarIntervaloMes(ano, mes);
    appointmentController
      .getAppointmentsByDateRange(inicio, fim)
      .then(setDatasComAgendamento)
      .catch(handleError);
  }, []);

  const markedDates = datasComAgendamento.reduce(
    (acc, appointment) => {
      const dataFormatada = DataNumberPraStringHifen(appointment.data);

      acc[dataFormatada] = {
        marked: true,
        dotColor: colors.PRIMARY_CONTRAST,
      };

      return acc;
    },
    {} as Record<string, any>,
  );

  markedDates[dateSelected] = {
    ...(markedDates[dateSelected] ?? {}),
    selected: true,
    selectedColor: colors.PRIMARY_CONTRAST,
    selectedTextColor: colors.BACKGROUND,
  };

  const s = useThemedStyles(styles);

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
        style={s.calendar}
        onDayPress={(day) => {
          setNewDate(day.dateString);
        }}
        markedDates={markedDates}
        theme={{
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
        }}
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
