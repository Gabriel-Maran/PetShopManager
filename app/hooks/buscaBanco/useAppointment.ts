import { useEffect } from "react";
import { useError } from "../useError";
import useFormState from "../useFormState";
import { useSearchPage } from "../useSearchPage";
import { petController } from "../../controller/PetController";
import { LIMIT_ITEM_PAGE } from "../../config/consts";
import { PetWithSpecieRaceAndOwner } from "../../model/Pet";
import { ServiceType } from "../../model/ServiceType";
import { serviceTypeRepository } from "../../repository/ServiceTypeRepository";
import { NewOrEditAppointmentParams } from "../../model/Appointment";
import { useScreen } from "../useScreen";
import { type IsoDate, todayIso } from "../../utils/datas";
import { formatMoneyInput } from "../../utils/dinheiro";
import { PaymentsMethod } from "../../model/PaymentMethod";
import { paymentMethodRepository } from "../../repository/PaymentsMethodsRepository";

//========================================================================//

type PetsSearchForm = {
  page: number;
  searchTxt: string;
};

type PetsForm = PetsSearchForm & {
  total: number;
  pets: PetWithSpecieRaceAndOwner[];
};

type PegarPetsReturn = {
  petsForm: PetsForm;
  updatePetsField: <K extends keyof PetsSearchForm>(
    field: K,
    value: PetsSearchForm[K],
  ) => void;
};

export function usePetsComEspecieERacaBanco(ativada: boolean): PegarPetsReturn {
  const { form, updateField } = useFormState<PetsSearchForm>({
    page: 0,
    searchTxt: "",
  });

  // A lista e o total vêm da mesma busca, só com o modal aberto, e uma resposta atrasada é descartada.
  const { items: pets, total } = useSearchPage(
    () =>
      petController.searchPetsPage({
        query: form.searchTxt,
        ativo: 1,
        page: form.page,
        limit: LIMIT_ITEM_PAGE,
      }),
    [form.searchTxt, form.page],
    ativada,
  );

  return {
    petsForm: { ...form, pets, total },
    updatePetsField: updateField,
  };
}

//=================================================================================//

type ServicesForm = {
  servico: ServiceType[];
};

type ServiceTypeReturn = {
  servicesForm: ServicesForm;
};

export function useServicos(): ServiceTypeReturn {
  const { showError } = useError();

  const { form, updateField } = useFormState<ServicesForm>({
    servico: [],
  });

  useEffect(() => {
    serviceTypeRepository
      .getAllServiceTypes()
      .then((value) => updateField("servico", value))
      .catch(showError);
  }, []);

  return {
    servicesForm: form,
  };
}

//================================================================================//

type PaymentMethodType = {
  tipos_pgto: PaymentsMethod[];
};

type PaymentMethodReturn = {
  pgtosForm: PaymentMethodType;
};

export function useTiposPagamento(): PaymentMethodReturn {
  const { showError } = useError();

  const { form, updateField } = useFormState<PaymentMethodType>({
    tipos_pgto: [],
  });

  useEffect(() => {
    paymentMethodRepository
      .getAllPaymentMethod()
      .then((value) => updateField("tipos_pgto", value))
      .catch(showError);
  }, []);

  return {
    pgtosForm: form,
  };
}

//================================================================================//

type AppointmentType = {
  nome_pet: string;
  pet_id: number;
  servico: string;
  data: IsoDate;
  hora: string;
  entregar_pet: number;
  concluido: number;
  observacao: string | null;
  is_auto_agen: number;
  nome_dono: string;
  especie: string;
  valor: string; // o texto do campo, como "80,00"; vira centavos ao salvar
  tipo_pgto: string;
  ta_pago: number;
};

type AppointmentTypeReturn = {
  appointmentsForm: AppointmentType;
  updateAppointmentsField: <K extends keyof AppointmentType>(
    field: K,
    value: AppointmentType[K],
  ) => void;
  /** Se o agendamento mudou desde que a tela abriu, para o voltar pedir confirmação. */
  isAppointmentDirty: boolean;
};

export function useAgendamentos(): AppointmentTypeReturn {
  const { params } = useScreen<NewOrEditAppointmentParams>();
  const { form, updateField, isDirty } = useFormState<AppointmentType>({
    nome_pet: params?.appointment?.nome_pet ?? "",
    pet_id: params?.appointment?.pet_id ?? 0,
    servico: params?.appointment?.servico ?? "",
    data: params?.appointment?.data ?? params?.dateSelected ?? todayIso(),
    hora: params?.appointment?.hora ?? "",
    entregar_pet: params?.appointment?.entregar_pet ?? 0,
    concluido: params?.appointment?.concluido ?? 0,
    observacao: params?.appointment?.observacao ?? "",
    is_auto_agen: params?.appointment?.is_auto_agen ?? 0,
    valor: formatMoneyInput(params?.appointment?.valor),
    tipo_pgto: params?.appointment?.tipo_pgto ?? "",
    ta_pago: params?.appointment?.ta_pago ?? 0,
    especie: "",
    nome_dono: "",
  });

  return {
    appointmentsForm: form,
    updateAppointmentsField: updateField,
    isAppointmentDirty: isDirty,
  };
}
