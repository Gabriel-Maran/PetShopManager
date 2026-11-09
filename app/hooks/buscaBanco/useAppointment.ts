import { useEffect } from "react";
import { useError } from "../useError";
import useFormState from "../useFormState";
import { petController } from "../../controller/PetController";
import { LIMIT_ITEM_PAGE, ORDER } from "../../config/consts";
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

type PetsForm = {
  page: number;
  total: number;
  searchTxt: string;
  pets: PetWithSpecieRaceAndOwner[];
};

type PegarPetsReturn = {
  petsForm: PetsForm;
  updatePetsField: <K extends keyof PetsForm>(
    field: K,
    value: PetsForm[K],
  ) => void;
};

export function usePetsComEspecieERacaBanco(ativada: boolean): PegarPetsReturn {
  const { showError } = useError();

  const { form, updateField } = useFormState<PetsForm>({
    page: 0,
    total: 0,
    searchTxt: "",
    pets: [],
  });

  // Busca a lista de pets — só roda quando o modal está aberto
  useEffect(() => {
    if (!ativada) return;

    petController
      .searchPetsByNamePagedWithSpecieAndRace(
        form.searchTxt,
        form.page,
        LIMIT_ITEM_PAGE,
        ORDER.DESC,
      )
      .then((value) => updateField("pets", value))
      .catch(showError);
  }, [ativada, form.searchTxt, form.page]);

  // Busca o total de pets para a paginação funcionar — era o que faltava
  // Não depende de `page` pois o total não muda ao trocar de página
  useEffect(() => {
    if (!ativada) return;

    petController
      .countPets(form.searchTxt)
      .then((value) => updateField("total", value))
      .catch(showError);
  }, [ativada, form.searchTxt]);

  return {
    petsForm: form,
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
  }, []); // ← [] correto, busca apenas uma vez

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

  // CORRIGIDO: estava sem [], re-buscava em todo render
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
};

export function useAgendamentos(): AppointmentTypeReturn {
  const { params } = useScreen<NewOrEditAppointmentParams>();
  const { form, updateField } = useFormState<AppointmentType>({
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
  };
}
