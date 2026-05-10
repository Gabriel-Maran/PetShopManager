import { createContext, useContext, useState } from "react";
import {
  Appointment,
  AppointmentsWithOwnerAndPet,
} from "../../model/Appointment";

type AgendamentosType = {
  dateSelected: string;
  setDateSelected: (data: string) => void;

  mesSelecionado: string;
  setMesSelecionado: (data: string) => void;

  datasComAgendamento: Appointment[];
  setDatasComAgendamento: (datasComAgen: Appointment[]) => void;

  appointments: AppointmentsWithOwnerAndPet[];
  setAppointments: (agendamentos: AppointmentsWithOwnerAndPet[]) => void;
};

const AgendamentosContext = createContext<AgendamentosType | undefined>(
  undefined,
);

export function AgendamentosProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dateSelected, setDateSelected] = useState(
    new Date().toLocaleDateString("en-CA", {
      timeZone: "America/Sao_Paulo",
    }),
  );
  const [mesSelecionado, setMesSelecionado] = useState<string>("");
  const [datasComAgendamento, setDatasComAgendamento] = useState<Appointment[]>(
    [],
  );
  const [appointments, setAppointments] = useState<
    AppointmentsWithOwnerAndPet[]
  >([]);

  return (
    <AgendamentosContext.Provider
      value={{
        dateSelected,
        setDateSelected,
        mesSelecionado,
        setMesSelecionado,
        datasComAgendamento,
        setDatasComAgendamento,
        appointments,
        setAppointments,
      }}
    >
      {children}
    </AgendamentosContext.Provider>
  );
}

export function useAgendamentos() {
  const context = useContext(AgendamentosContext);

  if (!context) {
    throw new Error(
      "useAgendamentos precisa ser usado dentro de AgendamentosProvider",
    );
  }

  return context;
}
