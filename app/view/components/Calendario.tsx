import { Calendar, LocaleConfig } from "react-native-calendars";
import { StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { COLORS } from "../../config/consts";

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
  return (
    <View style={styles.completeCalendar}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold",
          color: COLORS.TEXT_PRIMARY,
        }}
      >
        Calendário de Agendamentos
      </Text>
      <Calendar
        style={styles.calendar}
        onDayPress={(day) => {
          setNewDate(day.dateString);
        }}
        markedDates={{
          [dateSelected]: {
            selected: true,
            selectedColor: "#0E9599",
          },
        }}
        theme={{
          // Cores gerais
          backgroundColor: COLORS.BACKGROUND,
          calendarBackground: COLORS.BACKGROUND,

          // Texto do mês/ano no topo
          textMonthFontSize: 18,
          textMonthFontWeight: "600",
          monthTextColor: COLORS.TEXT_SECONDARY,

          // Cabeçalho (Dom, Seg, Ter...)
          textDayHeaderFontSize: 13,
          textSectionTitleColor: COLORS.TEXT_PRIMARY,

          // Números dos dias
          textDayFontSize: 18,
          dayTextColor: COLORS.TEXT_SECONDARY,

          // Dia selecionado
          selectedDayBackgroundColor: COLORS.PRIMARY_CONTRAST,
          selectedDayTextColor: COLORS.BACKGROUND,

          // Hoje
          todayTextColor: COLORS.PRIMARY_CONTRAST,

          // Dias desabilitados
          textDisabledColor: COLORS.THIRD_BACKGROUND,

          // Setas de navegação
          arrowColor: COLORS.PRIMARY_CONTRAST,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: {
    width: "100%",
  },
  completeCalendar: {
    backgroundColor: COLORS.BACKGROUND,
    width: "100%",
    justifyContent: "center",
    alignSelf: "center",
    padding: 10,
    borderColor: COLORS.BORDER_STRONG,
    borderWidth: 1,
    borderRadius: 15,
  },
});
