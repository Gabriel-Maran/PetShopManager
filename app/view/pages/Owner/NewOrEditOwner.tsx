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

import { Screen } from "../../../config/consts";
import { Owner } from "../../../model/Owner";
import { useScreen } from "../../../hooks/useScreen";
import { ownerController } from "../../../controller/OwnerController";
import TitleBar from "../../components/Cadastro/TitleBar";
import DefaultHeader from "../../components/Header/DefaultHeader";
import InputInfo from "../../components/Cadastro/InputInfo";
import { useError } from "../../../hooks/useError";

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export default function NewOrEditOwner({
  ownerToEdit,
}: {
  ownerToEdit?: Owner;
}) {
  const { showError } = useError();
  const isEditing = Boolean(ownerToEdit);
  const [isSucess, setIsSucess] = useState(true);

  const [nome, setNome] = useState(ownerToEdit?.nome ?? "");
  const [telefone, setTelefone] = useState(ownerToEdit?.telefone ?? "");
  const [email, setEmail] = useState(ownerToEdit?.email ?? "");
  const [endereco, setEndereco] = useState(ownerToEdit?.endereco ?? "");
  const { navigate } = useScreen();

  const salvarDono = async () => {
    try {
      await ownerController.createOwner(nome, telefone, email, endereco);
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
              image={require("../../../assets/personGreen.png")}
              item={nome}
              setItem={setNome}
              placeHolder="Digite o nome..."
              titleName="Nome Completo"
              hasBorderBottom={true}
            />
            <InputInfo
              image={require("../../../assets/phoneGreen.png")}
              item={telefone}
              setItem={(v) => setTelefone(maskPhone(v))}
              placeHolder="(46) 90000-0000"
              titleName="Telefone"
            />
          </View>
          <View style={styles.viewDataNotReq}>
            <Text style={styles.titleDataInfo}>DADOS OPCIONAIS</Text>
          </View>
          <View style={styles.inputs}>
            <InputInfo
              image={require("../../../assets/mailGreen.png")}
              item={email}
              setItem={setEmail}
              placeHolder="email@exemplo.email"
              titleName="E-mail"
              hasBorderBottom={true}
            />
            <InputInfo
              image={require("../../../assets/locationGreen.png")}
              item={endereco}
              setItem={setEndereco}
              placeHolder="Rua X, 456"
              titleName="Endereço"
            />
          </View>
          <View style={styles.ctnBtnSalvar}>
            <TouchableOpacity
              style={styles.btnSalvar}
              onPress={() => {
                salvarDono();
              }}
            >
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
