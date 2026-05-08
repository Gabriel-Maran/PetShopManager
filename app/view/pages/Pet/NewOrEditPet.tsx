import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useState } from "react";
import {
  EspeciesAtendidas,
  PacoteRemarcacao,
  PorteAnimal,
  Screen,
  TipoServico,
} from "../../../config/consts";
import { useError } from "../../../hooks/useError";
import { Pet, PetBuilder } from "../../../model/Pet";
import { petController } from "../../../controller/PetController";
import TitleBar from "../../components/Cadastro/TitleBar";
import DefaultHeader from "../../components/Header/DefaultHeader";
import InputInfo from "../../components/Cadastro/InputInfo";

export default function NewOrEditPet({ petToEdit }: { petToEdit?: Pet }) {
  const { showError } = useError();

  const [form, setForm] = useState({
    nome: petToEdit?.nome ?? "",
    especie: petToEdit?.especie ?? EspeciesAtendidas.CAO,
    dono_id: petToEdit?.dono_id ?? 0,
    raca: petToEdit?.raca ?? "",
    observacoes: petToEdit?.observacoes ?? "",
    servicoPadrao: petToEdit?.servico_padrao ?? TipoServico.Banho,
    remarcAtiva: petToEdit?.remarcacao_ativa ?? false,
    porte:
      petToEdit?.porte && petToEdit.porte in PorteAnimal
        ? (petToEdit.porte as PorteAnimal)
        : PorteAnimal.MEDIO,
    pacoteRemarcacao:
      petToEdit?.pacote_remarcacao &&
      petToEdit.pacote_remarcacao in PacoteRemarcacao
        ? (petToEdit.pacote_remarcacao as PacoteRemarcacao)
        : undefined,
    dataInicioPacote: petToEdit?.data_inicio_pacote ?? undefined,
  });

  const salvarPet = async () => {
    const petSalvar = new PetBuilder()
      .withNome(form.nome)
      .withEspecie(form.especie)
      .withPorte(form.porte)
      .forDono(form.dono_id)
      .withRaca(form.raca)
      .withObservacoes(form.observacoes)
      .withServicoPadrao(form.servicoPadrao)
      .isRemarcacaoAtiva(form.remarcAtiva ? 1 : 0)
      .withPacote(form.pacoteRemarcacao)
      .withInicioPacote(form.dataInicioPacote)
      .build();

    try {
      if (petToEdit?.id) {
        await petController.updatePet(petToEdit.id, petSalvar);
      } else {
        await petController.createPet(petSalvar);
      }
    } catch (erro) {
      showError(erro instanceof Error ? erro.message : "Erro inesperado.");
    }
  };

  const atualizarValores = (campo: keyof typeof form, valor: any) => {
    setForm((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  return (
    <>
      <DefaultHeader />
      <TitleBar
        returnTo={Screen.Cadastros}
        title={petToEdit ? "Editar Pet" : "Novo Pet"}
        subtitle="Preencha os dados do pet"
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.ctnCadastro}>
          <View style={styles.viewDataReq}>
            <Text style={styles.titleDataInfo}>DADOS OBRIGATÓRIOS</Text>
          </View>

          <View style={styles.inputs}>
            <InputInfo
              image={require("../../../assets/animais/iconPata.png")}
              item={form.nome}
              setItem={(v) => atualizarValores("nome", v)}
              placeHolder="Digite o nome..."
              titleName="Nome Completo"
              variasLinhas={false}
              hasBorderBottom={true}
            />
            <InputInfo
              image={require("../../../assets/animais/iconPata.png")}
              item={form.especie}
              setItem={(v) => atualizarValores("especie", v)}
              placeHolder="Digite a espécie..."
              titleName="Espécie"
              variasLinhas={false}
              hasBorderBottom={true}
            />
            <InputInfo
              image={require("../../../assets/nav_bar/ativados/personAddGreen.png")}
              item={form.raca}
              setItem={(v) => atualizarValores("raca", v)}
              placeHolder="Digite a raça..."
              titleName="Raça"
              variasLinhas={false}
              hasBorderBottom={true}
            />
          </View>
          <View style={styles.ctnBtnSalvar}>
            <TouchableOpacity style={styles.btnSalvar} onPress={salvarPet}>
              <Text style={styles.txtSalvar}>
                {petToEdit ? "Salvar alterações" : "Salvar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    backgroundColor: "#F5F5F5",
    flexGrow: 1,
  },
  ctnCadastro: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  viewDataReq: { width: "100%" },
  viewDataNotReq: {
    width: "100%",
    marginTop: 20,
  },
  inputs: {
    width: "100%",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EDEDED",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  titleDataInfo: {
    color: "#1D9D75",
    fontWeight: "500",
    marginBottom: 8,
  },
  ctnBtnSalvar: { marginTop: 25 },
  btnSalvar: {
    paddingVertical: 20,
    paddingHorizontal: 75,
    backgroundColor: "#1D9D75",
    borderRadius: 15,
  },
  txtSalvar: {
    color: "#fff",
    textAlign: "center",
  },
});
