import { StyleSheet, Text, View } from "react-native";
import { useEffect, useRef } from "react";

import { PacoteRemarcacao, TipoServico } from "../../../../config/consts";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../../Themes/ThemeProvider";

import {
  DataNumberPraStringHifen,
  DataStringPraNumber,
} from "../../../../utils/formatadores/converterData";
import { mascararHorario } from "../../../../utils/mascarar";
import { hoje } from "../../../../utils/dataPicker/dataPickerAux";

import InputDataPicker from "../Botões/DataPicker/InputDataPicker";
import InputInfo from "../InputInfo";
import InputSelect from "../../InputSelect";
import Toggle from "../Botões/Toggle";


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
    valorPacote: string;
    servicoPadrao: TipoServico;
    remarcAtiva: boolean;
    pacoteRemarcacao?: PacoteRemarcacao;
    dataInicioPacote?: number;
    horario_padrao?: string;
  };
  updateField: (field: string, value: any) => void;
  isEditavel: boolean;
  visible: boolean;
}

export default function AbaAgendamentoPet({
  visible = true,
  form,
  updateField,
  isEditavel = true,
}: AbaAgendamentoPetProps) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();

  // Controla se é a primeira renderização para não limpar dados ao abrir edição
  const isMounted = useRef(false);

  useEffect(() => {
    // Pula o primeiro render — evita apagar pacoteRemarcacao e dataInicioPacote
    // carregados do pet existente ao entrar na tela de edição
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    // Só limpa quando o usuário REALMENTE altera a flag de remarcação
    updateField("pacoteRemarcacao", undefined);
    updateField("dataInicioPacote", undefined);
    updateField("valorPacote", "");
    updateField("horario_padrao", "");
  }, [form.remarcAtiva]);

  if (visible == false) {
    return;
  }

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
        isEditavel={isEditavel}
      />

      <Toggle
        image={require("../../../../assets/outros/auto_gen.png")}
        value={form.remarcAtiva ? 1 : 0}
        onChange={(value) => updateField("remarcAtiva", value === 1)}
        title="Remarcação automática ativa"
        subtitle=""
        hasBorderBottom={true}
        noEdit={!isEditavel}
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
            isEditavel={isEditavel}
          />
          <InputInfo
            image={require("../../../../assets/outros/valor.png")}
            item={form.valorPacote}
            setItem={(item) => updateField("valorPacote", item)}
            titleName="Valor"
            variasLinhas={false}
            tipoTeclado="numeric"
            maximoCaracteres={7}
            digitavel={isEditavel}
            hasBorderBottom={true}
            placeHolder="Digite o valor..."
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
            isEditavel={isEditavel}
            hasBorderBottom={true}
          />
          <InputInfo
            image={require("../../../../assets/outros/hora.png")}
            item={form.horario_padrao || null}
            setItem={(item) => updateField("horario_padrao", mascararHorario(item))}
            titleName="Horário Padrão"
            variasLinhas={false}
            tipoTeclado="numeric"
            maximoCaracteres={5}
            digitavel={isEditavel}
            hasBorderBottom={false}
            placeHolder="Digite o horário..."
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
