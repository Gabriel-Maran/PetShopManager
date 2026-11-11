import { StyleSheet, Text, View } from "react-native";

import { PackageFrequency, ServiceName } from "../../../../config/consts";
import type { UpdateField } from "../../../../hooks/useFormState";
import type { PetForm } from "../../../pages/pet/petForm";
import { MAX_MONEY_INPUT_LENGTH, MAX_TIME_LENGTH } from "../../../../globals/limits";
import { ThemeColors, useTheme, useThemedStyles } from "../../../theme/ThemeProvider";

import { todayIso } from "../../../../utils/dates";
import { maskTime } from "../../../../utils/timeMask";
import { maskMoneyInput } from "../../../../utils/money";

import DatePickerField from "../datePicker/DatePickerField";
import InputInfo from "../InputInfo";
import InputSelect from "../../InputSelect";
import Toggle from "../buttons/Toggle";
import { RADIUS, SPACING } from "../../../theme/tokens";

const serviceTypesList = Object.values(ServiceName).map((v) => ({
  id: v,
  name: v,
}));

const packageFrequencies = Object.values(PackageFrequency).map((v) => ({
  id: v,
  name: v === PackageFrequency.Weekly ? "Mensal (4 semanas)" : "Quinzenal (2 semanas)",
}));

interface PetScheduleTabProps {
  form: PetForm;
  updateField: UpdateField<PetForm>;
  isEditable: boolean;
  visible: boolean;
}

export default function PetScheduleTab({
  visible = true,
  form,
  updateField,
  isEditable = true,
}: PetScheduleTabProps) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();

  // Ligar ou desligar a remarcação recomeça o pacote com os valores de um pet novo. A data volta para
  // hoje, e não para vazio, para o formulário desfeito ficar igual ao que abriu.
  const handleRescheduleChange = (value: number) => {
    updateField("rescheduleActive", value === 1);
    updateField("packageFrequency", undefined);
    updateField("packageStartDate", todayIso());
    updateField("packagePrice", "");
    updateField("defaultTime", "");
  };

  if (!visible) {
    return;
  }

  return (
    <View style={s.inputs}>
      <InputSelect
        image={require("../../../../assets/misc/services.png")}
        titleName="Serviço Padrão"
        placeholder="Selecione o serviço padrão..."
        options={serviceTypesList}
        itemSelected={serviceTypesList.find((e) => e.id === form.defaultService)}
        labelExtractor={(item) => item.name}
        onChange={(item) => updateField("defaultService", item.id)}
        renderItem={(item) => (
          <Text style={{ padding: SPACING[15], color: colors.TEXT_PRIMARY }}>{item.name}</Text>
        )}
        hasBorderBottom={true}
        isEditable={isEditable}
      />

      <Toggle
        image={require("../../../../assets/misc/autoScheduled.png")}
        value={form.rescheduleActive ? 1 : 0}
        onChange={handleRescheduleChange}
        title="Remarcação automática ativa"
        subtitle=""
        hasBorderBottom={true}
        noEdit={!isEditable}
      />

      {form.rescheduleActive && (
        <>
          <InputSelect
            image={require("../../../../assets/misc/package.png")}
            titleName="Pacote de Remarcação"
            placeholder="Selecione o pacote..."
            options={packageFrequencies}
            itemSelected={packageFrequencies.find((e) => e.id === form.packageFrequency)}
            labelExtractor={(item) => item.name}
            onChange={(item) => updateField("packageFrequency", item.id)}
            renderItem={(item) => (
              <Text style={{ padding: SPACING[15], color: colors.TEXT_PRIMARY }}>{item.name}</Text>
            )}
            hasBorderBottom={true}
            isEditable={isEditable}
          />
          <InputInfo
            image={require("../../../../assets/misc/price.png")}
            item={form.packagePrice}
            setItem={(item) => updateField("packagePrice", maskMoneyInput(item))}
            titleName="Valor"
            isMultiline={false}
            inputKeyboardType="numeric"
            maxChars={MAX_MONEY_INPUT_LENGTH}
            isTypeable={isEditable}
            hasBorderBottom={true}
            placeholder="Digite o valor..."
          />
          <DatePickerField
            image={require("../../../../assets/nav_bar/calendar.png")}
            item={form.packageStartDate}
            setItem={(v) => updateField("packageStartDate", v)}
            titleName={"Data do agendamento"}
            isEditable={isEditable}
            hasBorderBottom={true}
          />
          <InputInfo
            image={require("../../../../assets/misc/time.png")}
            item={form.defaultTime || null}
            setItem={(item) => updateField("defaultTime", maskTime(item))}
            titleName="Horário Padrão"
            isMultiline={false}
            inputKeyboardType="numeric"
            maxChars={MAX_TIME_LENGTH}
            isTypeable={isEditable}
            hasBorderBottom={false}
            placeholder="Digite o horário..."
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
      borderRadius: RADIUS[10],
      borderWidth: 1,
      borderColor: colors.BORDER_LIGHT,
      backgroundColor: colors.BACKGROUND,
      overflow: "hidden",
    },
  });
