import { StyleSheet, Text, View } from "react-native";

import { PacoteRemarcacao, TipoServico } from "../../../../config/consts";
import type { UpdateField } from "../../../../hooks/useFormState";
import type { PetForm } from "../../../pages/Pet/petForm";
import {
  MAX_MONEY_INPUT_LENGTH,
  MAX_TIME_LENGTH,
} from "../../../../globals/limits";
import {
  ThemeColors,
  useTheme,
  useThemedStyles,
} from "../../../Themes/ThemeProvider";

import { todayIso } from "../../../../utils/datas";
import { mascararHorario } from "../../../../utils/mascarar";
import { maskMoneyInput } from "../../../../utils/dinheiro";

import InputDataPicker from "../Botões/DataPicker/InputDataPicker";
import InputInfo from "../InputInfo";
import InputSelect from "../../InputSelect";
import Toggle from "../Botões/Toggle";


const tiposServicoList = Object.values(TipoServico).map((v) => ({
  id: v,
  nome: v,
}));

const pacotesRemarcacaoList = Object.values(PacoteRemarcacao).map((v) => ({
  id: v,
  nome:
    v === PacoteRemarcacao.Mensal ? "Mensal (4 semanas)" : "Quinzenal (2 semanas)",
}));

interface AbaAgendamentoPetProps {
  form: PetForm;
  updateField: UpdateField<PetForm>;
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

  // Ligar ou desligar a remarcação recomeça o pacote com os valores de um pet novo. A data volta para
  // hoje, e não para vazio, para o formulário desfeito ficar igual ao que abriu.
  const handleRemarcacaoChange = (value: number) => {
    updateField("remarcAtiva", value === 1);
    updateField("pacoteRemarcacao", undefined);
    updateField("dataInicioPacote", todayIso());
    updateField("valorPacote", "");
    updateField("horario_padrao", "");
  };

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
        onChange={handleRemarcacaoChange}
        title="Remarcação automática ativa"
        subtitle=""
        hasBorderBottom={true}
        noEdit={!isEditavel}
      />

      {form.remarcAtiva && (
        <>
          <InputSelect
            image={require("../../../../assets/outros/pacoteRemarcacao.png")}
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
            setItem={(item) => updateField("valorPacote", maskMoneyInput(item))}
            titleName="Valor"
            variasLinhas={false}
            tipoTeclado="numeric"
            maximoCaracteres={MAX_MONEY_INPUT_LENGTH}
            digitavel={isEditavel}
            hasBorderBottom={true}
            placeHolder="Digite o valor..."
          />
          <InputDataPicker
            image={require("../../../../assets/nav_bar/calendario.png")}
            item={form.dataInicioPacote}
            setItem={(v) => updateField("dataInicioPacote", v)}
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
            maximoCaracteres={MAX_TIME_LENGTH}
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
