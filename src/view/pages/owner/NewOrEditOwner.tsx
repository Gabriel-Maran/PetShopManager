import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useAsyncAction } from "../../../hooks/useAsyncAction";
import { useScreen } from "../../../hooks/useScreen";
import useFormState from "../../../hooks/useFormState";

import { RegistryParams, Screen } from "../../../config/consts";
import {
  MAX_ADDRESS_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_OWNER_NAME_LENGTH,
  MAX_PHONE_LENGTH,
} from "../../../globals/limits";
import { Owner, OwnerBuilder } from "../../../model/Owner";
import { ownerController } from "../../../controller/OwnerController";

import TitleBar from "../../components/registry/TitleBar";
import DefaultHeader from "../../components/header/DefaultHeader";
import InputInfo from "../../components/registry/InputInfo";
import FormSectionTitle from "../../components/registry/FormSectionTitle";
import SaveButton from "../../components/registry/SaveButton";
import { ThemeColors, useThemedStyles } from "../../theme/ThemeProvider";
import { RADIUS, SPACING } from "../../theme/tokens";

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
  const { params, navigate } = useScreen<RegistryParams>();

  const s = useThemedStyles(styles);

  const isViewing = params?.mode === "view";
  const isEditing = params?.mode === "edit";

  const { form, updateField, isDirty } = useFormState({
    name: params?.owner?.name ?? "",
    phone: params?.owner?.phone ?? "",
    email: params?.owner?.email ?? "",
    address: params?.owner?.address ?? "",
  });

  const { run: saveOwner, isRunning: isSavingRecord } = useAsyncAction(
    async () => {
      const ownerToSave: Owner = new OwnerBuilder()
        .withName(form.name)
        .withPhone(form.phone)
        .withEmail(form.email)
        .withAddress(form.address)
        .build();
      if (isEditing) {
        await ownerController.updateOwner(params!.owner?.id!, ownerToSave);
      } else {
        await ownerController.createOwner(ownerToSave);
      }
      navigate(Screen.Registry, {
        type: "OWNER",
        mode: "view",
      } as RegistryParams);
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
        hasUnsavedChanges={isDirty}
      />
      <ScrollView
        contentContainerStyle={s.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.ctnRegistry}>
          <View style={s.requiredFieldBox}>
            <FormSectionTitle title="Dados obrigatórios" />
          </View>
          <View style={s.inputs}>
            <InputInfo
              image={require("../../../assets/nav_bar/personAdd.png")}
              item={form.name}
              setItem={(v) => updateField("name", v)}
              placeholder="Digite o nome..."
              titleName="Nome Completo"
              isMultiline={false}
              isTypeable={!isViewing}
              maxChars={MAX_OWNER_NAME_LENGTH}
              hasBorderBottom={true}
            />
            <InputInfo
              image={require("../../../assets/outros/phoneGreen.png")}
              item={form.phone}
              setItem={(v) => updateField("phone", maskPhone(v))}
              placeholder="(46) 90000-0000"
              titleName="Telefone"
              isTypeable={!isViewing}
              maxChars={MAX_PHONE_LENGTH}
              inputKeyboardType="phone-pad"
              isMultiline={false}
            />
          </View>
          <View style={s.optionalFieldBox}>
            <FormSectionTitle title="Dados opcionais" />
          </View>
          <View style={s.inputs}>
            <InputInfo
              image={require("../../../assets/outros/mailGreen.png")}
              item={form.email}
              setItem={(v) => updateField("email", v)}
              placeholder="email@exemplo.email"
              titleName="E-mail"
              isMultiline={false}
              isTypeable={!isViewing}
              maxChars={MAX_EMAIL_LENGTH}
              inputKeyboardType="email-address"
              hasBorderBottom={true}
            />
            <InputInfo
              image={require("../../../assets/outros/locationGreen.png")}
              item={form.address}
              setItem={(v) => updateField("address", v)}
              placeholder="Rua X, 456"
              titleName="Endereço"
              isMultiline={true}
              isTypeable={!isViewing}
              maxChars={MAX_ADDRESS_LENGTH}
            />
          </View>
          {!isViewing && (
            <View style={s.ctnBtnSave}>
              <SaveButton
                isEditing={isEditing}
                isSaving={isSavingRecord}
                onPress={saveOwner}
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
    ctnRegistry: {
      flex: 1,
      padding: SPACING[20],
      alignItems: "center",
    },
    requiredFieldBox: { width: "100%" },
    optionalFieldBox: {
      width: "100%",
      marginTop: SPACING[20],
    },
    inputs: {
      width: "100%",
      borderRadius: RADIUS[10],
      borderWidth: 1,
      borderColor: colors.BORDER_LIGHT,
      backgroundColor: colors.BACKGROUND,
      overflow: "hidden",
    },
    ctnBtnSave: { marginTop: SPACING[25] },
  });
