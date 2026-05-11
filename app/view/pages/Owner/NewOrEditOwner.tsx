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

import { Screen } from "../../../config/consts";
import {
  Owner,
  OwnerBuilder,
  NewOrEditOwnerParams,
} from "../../../model/Owner";
import { ownerController } from "../../../controller/OwnerController";

import TitleBar from "../../components/Cadastro/TitleBar";
import DefaultHeader from "../../components/Header/DefaultHeader";
import InputInfo from "../../components/Cadastro/InputInfo";
import { ThemeColors, useThemedStyles } from "../../Themes/ThemeProvider";

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
  const { params, navigate } = useScreen<NewOrEditOwnerParams>();
  const { showError } = useError();

  const s = useThemedStyles(styles);

  const isViewing = params?.mode === "view";
  const isEditing = params?.mode === "edit";

  const [nome, setNome] = useState(params?.Owner?.nome ?? "");
  const [telefone, setTelefone] = useState(params?.Owner?.telefone ?? "");
  const [email, setEmail] = useState(params?.Owner?.email ?? "");
  const [endereco, setEndereco] = useState(params?.Owner?.endereco ?? "");

  const salvarDono = async () => {
    const ownerSalvar: Owner = new OwnerBuilder()
      .withNome(nome)
      .withTelefone(telefone)
      .withEmail(email)
      .withEndereco(endereco)
      .build();
    try {
      if (isEditing) {
        await ownerController.updateOwner(params!.Owner?.id!, ownerSalvar);
      } else {
        await ownerController.createOwner(ownerSalvar);
      }
      navigate(Screen.Cadastros, "OWNERS");
    } catch (erro) {
      showError(erro instanceof Error ? erro.message : "Erro inesperado.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <DefaultHeader />
      <TitleBar
        returnTo={Screen.Cadastros}
        title={isViewing ? "Visualizando Dono" : isEditing ? "Editar Dono" : "Novo Dono"}
        subtitle={!isViewing ? "Preencha os dados do responsável" : ""}
      />
      <ScrollView
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.ctnCadastro}>
          <View style={s.viewDataReq}>
            <Text style={s.titleDataInfo}>DADOS OBRIGATÓRIOS</Text>
          </View>
          <View style={s.inputs}>
            <InputInfo
              image={require("../../../assets/nav_bar/personAdd.png")}
              item={nome}
              setItem={setNome}
              placeHolder="Digite o nome..."
              titleName="Nome Completo"
              variasLinhas={false}
              digitavel={!isViewing}
              hasBorderBottom={true}
            />
            <InputInfo
              image={require("../../../assets/outros/phoneGreen.png")}
              item={telefone}
              setItem={(v) => setTelefone(maskPhone(v))}
              placeHolder="(46) 90000-0000"
              titleName="Telefone"
              digitavel={!isViewing}
              variasLinhas={false}
            />
          </View>
          <View style={s.viewDataNotReq}>
            <Text style={s.titleDataInfo}>DADOS OPCIONAIS</Text>
          </View>
          <View style={s.inputs}>
            <InputInfo
              image={require("../../../assets/outros/mailGreen.png")}
              item={email}
              setItem={setEmail}
              placeHolder="email@exemplo.email"
              titleName="E-mail"
              variasLinhas={false}
              digitavel={!isViewing}
              hasBorderBottom={true}
            />
            <InputInfo
              image={require("../../../assets/outros/locationGreen.png")}
              item={endereco}
              setItem={setEndereco}
              placeHolder="Rua X, 456"
              variasLinhas={true}
              digitavel={!isViewing}
              titleName="Endereço"
            />
          </View>
          {!isViewing && (
          <View style={s.ctnBtnSalvar}>
            <TouchableOpacity style={s.btnSalvar} onPress={salvarDono}>
              <Text style={s.txtSalvar}>
                {isEditing ? "Salvar alterações" : "Salvar"}
              </Text>
            </TouchableOpacity>
          </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    scrollContent: {
      backgroundColor: colors.THIRD_BACKGROUND,
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
      borderColor: colors.BORDER_LIGHT,
      backgroundColor: colors.BACKGROUND,
      overflow: "hidden",
    },
    titleDataInfo: {
      color: colors.PRIMARY_VARIANT,
      fontWeight: "500",
      marginBottom: 8,
    },
    ctnBtnSalvar: { marginTop: 25 },
    btnSalvar: {
      paddingVertical: 20,
      paddingHorizontal: 75,
      backgroundColor: colors.PRIMARY_VARIANT,
      borderRadius: 15,
    },
    txtSalvar: {
      color: colors.BACKGROUND,
      textAlign: "center",
    },
  });
