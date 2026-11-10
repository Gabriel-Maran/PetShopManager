import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useState } from "react";

import { useAsyncAction } from "../../../hooks/useAsyncAction";
import { useScreen } from "../../../hooks/useScreen";

import { NewOrEditCadastros, Screen } from "../../../config/consts";
import {
  MAX_ADDRESS_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_OWNER_NAME_LENGTH,
  MAX_PHONE_LENGTH,
} from "../../../globals/limits";
import { Owner, OwnerBuilder } from "../../../model/Owner";
import { ownerController } from "../../../controller/OwnerController";

import TitleBar from "../../components/Cadastro/TitleBar";
import DefaultHeader from "../../components/Header/DefaultHeader";
import InputInfo from "../../components/Cadastro/InputInfo";
import FormSectionTitle from "../../components/Cadastro/FormSectionTitle";
import SaveButton from "../../components/Cadastro/SaveButton";
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
  const { params, navigate } = useScreen<NewOrEditCadastros>();

  const s = useThemedStyles(styles);

  const isViewing = params?.mode === "view";
  const isEditing = params?.mode === "edit";

  const [nome, setNome] = useState(params?.owner?.nome ?? "");
  const [telefone, setTelefone] = useState(params?.owner?.telefone ?? "");
  const [email, setEmail] = useState(params?.owner?.email ?? "");
  const [endereco, setEndereco] = useState(params?.owner?.endereco ?? "");

  const { run: salvarDono, isRunning: isSalvando } = useAsyncAction(
    async () => {
      const ownerSalvar: Owner = new OwnerBuilder()
        .withNome(nome)
        .withTelefone(telefone)
        .withEmail(email)
        .withEndereco(endereco)
        .build();
      if (isEditing) {
        await ownerController.updateOwner(params!.owner?.id!, ownerSalvar);
      } else {
        await ownerController.createOwner(ownerSalvar);
      }
      navigate(Screen.Cadastros, {
        type: "DONO",
        mode: "view",
      } as NewOrEditCadastros);
    },
  );

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <DefaultHeader />
      <TitleBar
        title={
          isViewing
            ? "Visualizando Dono"
            : isEditing
              ? "Editar Dono"
              : "Novo Dono"
        }
        subtitle={"Preencha os dados do responsável"}
        isViewing={isViewing}
        confirmReturn={!isViewing}
      />
      <ScrollView
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.ctnCadastro}>
          <View style={s.viewDataReq}>
            <FormSectionTitle title="Dados obrigatórios" />
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
              maximoCaracteres={MAX_OWNER_NAME_LENGTH}
              hasBorderBottom={true}
            />
            <InputInfo
              image={require("../../../assets/outros/phoneGreen.png")}
              item={telefone}
              setItem={(v) => setTelefone(maskPhone(v))}
              placeHolder="(46) 90000-0000"
              titleName="Telefone"
              digitavel={!isViewing}
              maximoCaracteres={MAX_PHONE_LENGTH}
              tipoTeclado="phone-pad"
              variasLinhas={false}
            />
          </View>
          <View style={s.viewDataNotReq}>
            <FormSectionTitle title="Dados opcionais" />
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
              maximoCaracteres={MAX_EMAIL_LENGTH}
              tipoTeclado="email-address"
              hasBorderBottom={true}
            />
            <InputInfo
              image={require("../../../assets/outros/locationGreen.png")}
              item={endereco}
              setItem={setEndereco}
              placeHolder="Rua X, 456"
              titleName="Endereço"
              variasLinhas={true}
              digitavel={!isViewing}
              maximoCaracteres={MAX_ADDRESS_LENGTH}
            />
          </View>
          {!isViewing && (
            <View style={s.ctnBtnSalvar}>
              <SaveButton
                isEditing={isEditing}
                isSaving={isSalvando}
                onPress={salvarDono}
              />
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
    ctnBtnSalvar: { marginTop: 25 },
  });
