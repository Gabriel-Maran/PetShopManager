import { StyleSheet, Text, View } from "react-native";
import { PacoteRemarcacao, TipoServico } from "../../../../config/consts";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../../Themes/ThemeProvider";
import InputSelect from "../../InputSelect";
import Toggle from "../Botões/Toggle";
import Mascarar from "../../../../utils/mascarar";
import {
  DataNumberPraStringHifen,
  DataStringPraNumber,
} from "../../../../utils/formatadores/converterData";
import { useEffect } from "react";
import InputDataPicker from "../Botões/DataPicker/InputDataPicker";
import { hoje } from "../../../../utils/dataPicker/dataPickerAux";

// Correção 1: Filtra apenas os valores numéricos do enum
const tiposServicoList = Object.values(TipoServico).map((v) => ({
  id: v,
  nome: v,
}));

const pacotesRemarcacaoList = Object.values(PacoteRemarcacao)
  .filter((v): v is PacoteRemarcacao => typeof v === "number")
  .map((v) => ({
    id: v,
    nome:
      v === PacoteRemarcacao.Mensal
        ? "Mensal (4 semanas)"
        : "Quinzenal (2 semanas)",
  }));

interface AbaAgendamentoPetProps {
  form: {
    servicoPadrao: TipoServico;
    remarcAtiva: boolean;
    pacoteRemarcacao?: PacoteRemarcacao;
    dataInicioPacote?: number;
  };
  updateField: (field: string, value: any) => void;
}

export default function AbaAgendamentoPet({
  form,
  updateField,
}: AbaAgendamentoPetProps) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();

  useEffect(() => {
    form.pacoteRemarcacao = undefined;
    form.dataInicioPacote = undefined;
  }, [form.remarcAtiva]);

  return (
    <View style={s.inputs}>
      <InputSelect
        image={require("../../../../assets/outros/servicos.png")}
        titleName="Serviço Padrão"
        placeholder="Selecione o serviço padrão..."
        itens={tiposServicoList}
        itemSelected={tiposServicoList.find((e) => e.id === form.servicoPadrao)}
        labelExtractor={(item) => item.nome}
        onChange={(item) => updateField("servicoPadrao", item.id)}
        renderItem={(item) => (
          <Text style={{ padding: 15, color: colors.TEXT_PRIMARY }}>
            {item.nome}
          </Text>
        )}
        hasBorderBottom={true}
      />

      <Toggle
        image={require("../../../../assets/outros/auto_gen.png")}
        value={form.remarcAtiva ? 1 : 0}
        onChange={(value) => updateField("remarcAtiva", value === 1)}
        title="Remarcação automática ativa"
        subtitle=""
        hasBorderBottom={true}
        noEdit={false}
      />

      {form.remarcAtiva && (
        <>
          <InputSelect
            image={require("../../../../assets/outros/pacoteRemarcacao.webp")}
            titleName="Pacote de Remarcação"
            placeholder="Selecione o pacote..."
            itens={pacotesRemarcacaoList}
            itemSelected={pacotesRemarcacaoList.find(
              (e) => e.id === form.pacoteRemarcacao,
            )}
            labelExtractor={(item) => item.nome}
            onChange={(item) => updateField("pacoteRemarcacao", item.id)}
            renderItem={(item) => (
              <Text style={{ padding: 15, color: colors.TEXT_PRIMARY }}>
                {item.nome}
              </Text>
            )}
            hasBorderBottom={true}
          />
          <InputDataPicker
            image={require("../../../../assets/nav_bar/calendario.png")}
            item={DataNumberPraStringHifen(
              form.dataInicioPacote ?? DataStringPraNumber(hoje(), "-"),
            )}
            setItem={(v) => {
              updateField("dataInicioPacote", DataStringPraNumber(v, "-"));
            }}
            titleName={"Data do agendamento"}
            hasBorderBottom={false}
          />
        </>
      )}
    </View>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    inputs: {
      width: "100%",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.BORDER_LIGHT,
      backgroundColor: colors.BACKGROUND,
      overflow: "hidden",
    },
  });
