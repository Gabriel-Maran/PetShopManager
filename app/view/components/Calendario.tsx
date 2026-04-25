import { Calendar, LocaleConfig } from "react-native-calendars";
import { StyleSheet, Text, View } from "react-native";
import { useState } from "react";

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
  // new Date().toISOString() -> "2025-04-24T12:34:56.789Z"
  // .split('T')[0] -> "2025-04-24", o [0] pega só a parte da data(ano-mês-dia), sem a parte do horário
  // Isso é só para marcar o dia atual no calendário e inicializar o estado com a data de hoje
  const [selected, setSelected] = useState(
    new Date().toISOString().split("T")[0],
  );
  return (
    <View style={styles.completeCalendar}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>
        Calendário de Agendamentos
      </Text>
      <Calendar
        style={styles.calendar}
        onDayPress={(day) => {
          setSelected(day.dateString); // ex: "2025-04-24"
        }}
        markedDates={{
          [selected]: {
            selected: true,
            selectedColor: "#378ADD",
          },
        }}
        theme={{
          // Cores gerais
          backgroundColor: "#ffffff",
          calendarBackground: "#ffffff",

          // Texto do mês/ano no topo
          textMonthFontSize: 18,
          textMonthFontWeight: "600",
          monthTextColor: "#2C2C2A",

          // Cabeçalho (Dom, Seg, Ter...)
          textDayHeaderFontSize: 13,
          textSectionTitleColor: "#000000",

          // Números dos dias
          textDayFontSize: 18,
          dayTextColor: "#2C2C2A",

          // Dia selecionado
          selectedDayBackgroundColor: "#378ADD",
          selectedDayTextColor: "#ffffff",

          // Hoje
          todayTextColor: "#378ADD",

          // Dias desabilitados
          textDisabledColor: "#d9d9d9",

          // Setas de navegação
          arrowColor: "#378ADD",
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
    backgroundColor: "#fff",
    width: "100%",
    justifyContent: "center",
    alignSelf: "center",
    padding: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 15,
  },
});
