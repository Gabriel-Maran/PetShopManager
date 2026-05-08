import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useState } from "react";

import { useError } from "../../../hooks/useError";
import { useScreen } from "../../../hooks/useScreen";

import { COLORS, Screen } from "../../../config/consts";
import { Owner, OwnerBuilder } from "../../../model/Owner";
import { ownerController } from "../../../controller/OwnerController";

import TitleBar from "../../components/Cadastro/TitleBar";
import DefaultHeader from "../../components/Header/DefaultHeader";
import InputInfo from "../../components/Cadastro/InputInfo";

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "");
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6, 10)}`;
  }
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
};

export default function NewOrEditOwner() {
  const { params, navigate } = useScreen<Owner>();
  const { showError } = useError();

  const isEditing = Boolean(params?.id);

  const [nome, setNome] = useState(params?.nome ?? "");
  const [telefone, setTelefone] = useState(params?.telefone ?? "");
  const [email, setEmail] = useState(params?.email ?? "");
  const [endereco, setEndereco] = useState(params?.endereco ?? "");

  const salvarDono = async () => {
    const ownerSalvar: Owner = new OwnerBuilder()
      .withNome(nome)
      .withTelefone(telefone)
      .withEmail(email)
      .withEndereco(endereco)
      .build();
    try {
      if (isEditing) {
        await ownerController.updateOwner(params!.id!, ownerSalvar);
      } else {
        await ownerController.createOwner(ownerSalvar);
      }
      navigate(Screen.Cadastros);
    } catch (erro) {
      showError(erro instanceof Error ? erro.message : "Erro inesperado.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <DefaultHeader />
      <TitleBar
        returnTo={Screen.Cadastros}
        title={isEditing ? "Editar Dono" : "Novo Dono"}
        subtitle="Preencha os dados do responsável"
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
              image={require("../../../assets/nav_bar/personAdd.png")}
              item={nome}
              setItem={setNome}
              placeHolder="Digite o nome..."
              titleName="Nome Completo"
              variasLinhas={false}
              digitavel={true}
              hasBorderBottom={true}
            />
            <InputInfo
              image={require("../../../assets/outros/phoneGreen.png")}
              item={telefone}
              setItem={(v) => setTelefone(maskPhone(v))}
              placeHolder="(46) 90000-0000"
              titleName="Telefone"
              digitavel={true}
              variasLinhas={false}
            />
          </View>
          <View style={styles.viewDataNotReq}>
            <Text style={styles.titleDataInfo}>DADOS OPCIONAIS</Text>
          </View>
          <View style={styles.inputs}>
            <InputInfo
              image={require("../../../assets/outros/mailGreen.png")}
              item={email}
              setItem={setEmail}
              placeHolder="email@exemplo.email"
              titleName="E-mail"
              variasLinhas={false}
              digitavel={true}
              hasBorderBottom={true}
            />
            <InputInfo
              image={require("../../../assets/outros/locationGreen.png")}
              item={endereco}
              setItem={setEndereco}
              placeHolder="Rua X, 456"
              variasLinhas={true}
              digitavel={true}
              titleName="Endereço"
            />
          </View>
          <View style={styles.ctnBtnSalvar}>
            <TouchableOpacity style={styles.btnSalvar} onPress={salvarDono}>
              <Text style={styles.txtSalvar}>
                {isEditing ? "Salvar alterações" : "Salvar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    backgroundColor: COLORS.THIRD_BACKGROUND,
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
    borderColor: COLORS.BORDER_LIGHT,
    backgroundColor: COLORS.BACKGROUND,
    overflow: "hidden",
  },
  titleDataInfo: {
    color: COLORS.PRIMARY_VARIANT,
    fontWeight: "500",
    marginBottom: 8,
  },
  ctnBtnSalvar: { marginTop: 25 },
  btnSalvar: {
    paddingVertical: 20,
    paddingHorizontal: 75,
    backgroundColor: COLORS.PRIMARY_VARIANT,
    borderRadius: 15,
  },
  txtSalvar: {
    color: COLORS.BACKGROUND,
    textAlign: "center",
  },
});
