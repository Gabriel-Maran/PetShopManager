import { useEffect } from "react";
import { useError } from "../../hooks/useError";
import useFormState from "../../hooks/useFormState";
import { petController } from "../../controller/PetController";
import { LIMIT_ITEM_PAGE, ORDER } from "../../config/consts";
import { PetWithSpecieAndRace } from "../../model/Pet";
import { ServiceType } from "../../model/ServiceType";
import { serviceTypeRepository } from "../../repository/ServiceTypeRepository";
import {
  Appointment,
  AppointmentsWithOwnerAndPet,
  NewOrEditAppointmentParams,
} from "../../model/Appointment";
import { useScreen } from "../../hooks/useScreen";
import {
  DataHifenPraBarra,
  DataNumberPraString,
} from "../formatadores/converterData";

type PetsForm = {
  page: number;
  total: number;
  searchTxt: string;
  pets: PetWithSpecieAndRace[];
};

type PegarPetsReturn = {
  petsForm: PetsForm;
  updatePetsField: <K extends keyof PetsForm>(
    field: K,
    value: PetsForm[K],
  ) => void;
};

export function usePetsComEspecieERacaBanco(ativada?: boolean): PegarPetsReturn {
  const { showError } = useError();
  const handleError = (e: unknown) =>
    showError(e instanceof Error ? e.message : "Erro inesperado.");

  const { form, updateField } = useFormState<PetsForm>({
    page: 0,
    total: 0,
    searchTxt: "",
    pets: [],
  });

  useEffect(() => {
    petController
      .searchPetsByNamePagedWithSpecieAndRace(
        form.searchTxt,
        form.page,
        LIMIT_ITEM_PAGE,
        ORDER.DESC,
      )
      .then((value) => updateField("pets", value))
      .catch(handleError);
  }, [form.searchTxt, form.page]);

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
  const handleError = (e: unknown) =>
    showError(e instanceof Error ? e.message : "Erro inesperado.");

  const { form, updateField } = useFormState<ServicesForm>({
    servico: [],
  });

  useEffect(() => {
    serviceTypeRepository
      .getAllServiceTypes()
      .then((value) => updateField("servico", value))
      .catch(handleError);
  }, []);

  return {
    servicesForm: form,
  };
}

//================================================================================//

type AppointmentType = {
  nome_pet: string;
  pet_id: number;
  servico: string;
  data: string;
  hora: string;
  entregar_pet: number; // 0 ou 1
  concluido: number; // 0 ou 1
  observacao: string | null;
  is_auto_agen: number; // 0 ou 1
  nome_dono: string;
  especie: string;
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
    data: params?.appointment?.data
      ? DataNumberPraString(params?.appointment?.data)
      : params?.dateSelected
        ? DataHifenPraBarra(params?.dateSelected)
        : "",
    hora: params?.appointment?.hora ?? "",
    entregar_pet: params?.appointment?.entregar_pet ?? 0,
    concluido: params?.appointment?.concluido ?? 0,
    observacao: params?.appointment?.observacao ?? "",

    //Quando não auto gerado, o db já criar isso como false(ou seja, 0), so fica true isso aqui quando é criado na trigger
    //Minha ideia é não alterar isso, por conta de que, foi criado automatico e se o dono do petshop mudar
    //deve continuar como auto gerado
    //Mas é interessante fazer algo visual para mostrar se foi auto gerado ou não
    is_auto_agen: params?.appointment?.is_auto_agen ?? 0,
    //================================================
    especie: "",
    nome_dono: "",
  });
  return {
    appointmentsForm: form,
    updateAppointmentsField: updateField,
  };
}
