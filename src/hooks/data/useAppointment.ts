import { useAsyncData } from "../useAsyncData";
import useFormState from "../useFormState";
import { useSearchPage } from "../useSearchPage";
import { petController } from "../../controller/PetController";
import { LIMIT_ITEM_PAGE } from "../../config/consts";
import { PetWithSpeciesBreedAndOwner } from "../../model/Pet";
import { ServiceType } from "../../model/ServiceType";
import { serviceTypeService } from "../../service/ServiceTypeService";
import { NewOrEditAppointmentParams } from "../../model/Appointment";
import { useScreen } from "../useScreen";
import { type IsoDate, todayIso } from "../../utils/dates";
import { formatMoneyInput } from "../../utils/money";
import { PaymentMethod } from "../../model/PaymentMethod";
import { paymentMethodService } from "../../service/PaymentMethodService";

//========================================================================//

type PetsSearchForm = {
  page: number;
  searchTxt: string;
};

type PetsForm = PetsSearchForm & {
  total: number;
  pets: PetWithSpeciesBreedAndOwner[];
};

type UsePetsResult = {
  petsForm: PetsForm;
  updatePetsField: <K extends keyof PetsSearchForm>(
    field: K,
    value: PetsSearchForm[K],
  ) => void;
};

export function usePetsWithSpeciesAndBreed(enabled: boolean): UsePetsResult {
  const { form, updateField } = useFormState<PetsSearchForm>({
    page: 0,
    searchTxt: "",
  });

  // A lista e o total vêm da mesma busca, só com o modal aberto, e uma resposta atrasada é descartada.
  const { items: pets, total } = useSearchPage(
    () =>
      petController.searchPetsPage({
        query: form.searchTxt,
        active: 1,
        page: form.page,
        limit: LIMIT_ITEM_PAGE,
      }),
    [form.searchTxt, form.page],
    enabled,
  );

  return {
    petsForm: { ...form, pets, total },
    updatePetsField: updateField,
  };
}

//=================================================================================//

type ServicesForm = {
  service: ServiceType[];
};

type ServiceTypeReturn = {
  servicesForm: ServicesForm;
};

/** Os serviços do seletor do agendamento. Até carregar, ou se falhar, a lista fica vazia. */
export function useServices(): ServiceTypeReturn {
  const { data } = useAsyncData(() => serviceTypeService.getAllServiceTypes());

  return {
    servicesForm: { service: data ?? [] },
  };
}

//================================================================================//

type PaymentMethodType = {
  paymentMethods: PaymentMethod[];
};

type PaymentMethodReturn = {
  paymentMethodsForm: PaymentMethodType;
};

/** As formas de pagamento do seletor do agendamento. Até carregar, ou se falhar, a lista fica vazia. */
export function usePaymentMethods(): PaymentMethodReturn {
  const { data } = useAsyncData(() => paymentMethodService.getAllPaymentMethods());

  return {
    paymentMethodsForm: { paymentMethods: data ?? [] },
  };
}

//================================================================================//

type AppointmentType = {
  pet_name: string;
  pet_id: number;
  service: string;
  date: IsoDate;
  time: string;
  deliver_pet: number;
  completed: number;
  notes: string | null;
  is_auto: number;
  owner_name: string;
  species_id: string;
  price: string; // o texto do campo, como "80,00"; vira centavos ao salvar
  payment_method: string;
  is_paid: number;
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

export function useAppointmentForm(): AppointmentTypeReturn {
  const { params } = useScreen<NewOrEditAppointmentParams>();
  const { form, updateField, isDirty } = useFormState<AppointmentType>({
    pet_name: params?.appointment?.pet_name ?? "",
    pet_id: params?.appointment?.pet_id ?? 0,
    service: params?.appointment?.service ?? "",
    date: params?.appointment?.date ?? params?.dateSelected ?? todayIso(),
    time: params?.appointment?.time ?? "",
    deliver_pet: params?.appointment?.deliver_pet ?? 0,
    completed: params?.appointment?.completed ?? 0,
    notes: params?.appointment?.notes ?? "",
    is_auto: params?.appointment?.is_auto ?? 0,
    price: formatMoneyInput(params?.appointment?.price),
    payment_method: params?.appointment?.payment_method ?? "",
    is_paid: params?.appointment?.is_paid ?? 0,
    species_id: "",
    owner_name: "",
  });

  return {
    appointmentsForm: form,
    updateAppointmentsField: updateField,
    isAppointmentDirty: isDirty,
  };
}
