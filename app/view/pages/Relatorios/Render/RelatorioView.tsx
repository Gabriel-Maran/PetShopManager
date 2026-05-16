import { StyleSheet, Text } from "react-native";
import { RelatorioType, Screen } from "../../../../config/consts";
import ComparativoMensal from "../ComparativoMensal";
import DiasHorasMaisAtendidas from "../DiasHorasMaisAtendidas";
import OrigemAgendamentos from "../OrigemAgendamentos";
import PetsAusentes from "../PetsAusentes";
import RemarcacoesIntervals from "../RemarcacoesIntervals";
import { useState } from "react";
import TitleBar from "../../../components/Cadastro/TitleBar";
import { DatePicker } from "../../../components/Cadastro/Botões/DataPicker/DatePicker";
import { hoje } from "../../../../utils/dataPicker/dataPickerAux";
import InputDataPicker from "../../../components/Cadastro/Botões/DataPicker/InputDataPicker";

export default function RelatorioView({ route }: { route: RelatorioType }) {
  const [date, setDate] = useState(hoje());
  const [erro, setErro] = useState();

  switch (route) {
    case RelatorioType.DiasHorasMovimentados:
      return <DiasHorasMaisAtendidas />;
    case RelatorioType.OrigemAgendamentos:
      return <OrigemAgendamentos />;
    case RelatorioType.PetsAusentes:
      return <PetsAusentes />;
    case RelatorioType.Remarcacoes:
      return <RemarcacoesIntervals />;
    case RelatorioType.ComparativoMensal:
      return <ComparativoMensal />;
    case RelatorioType.Pacotes:
      return (
        <>
          <Text>{date}</Text>
          <TitleBar
            returnTo={Screen.Relatorios}
            title="TESTE"
            subtitle="TESTE"
          />
        </>
      );
    default:
      return <DiasHorasMaisAtendidas />;
  }
}

// Centralização de estilos com StyleSheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
});
