import { createContext, useContext, useState } from "react";
import {
  Appointment,
  AppointmentsWithOwnerAndPet,
} from "../../model/Appointment";
import { todayIso } from "../../utils/dates";

type CalendarContextType = {
  dateSelected: string;
  setDateSelected: (data: string) => void;

  selectedMonth: string;
  setSelectedMonth: (data: string) => void;

  datedAppointments: Appointment[];
  setDatedAppointments: (appointmentsWithDates: Appointment[]) => void;

  appointments: AppointmentsWithOwnerAndPet[];
  setAppointments: (appointments: AppointmentsWithOwnerAndPet[]) => void;
};

const CalendarContext = createContext<CalendarContextType | undefined>(
  undefined,
);

export function CalendarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dateSelected, setDateSelected] = useState(todayIso);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [datedAppointments, setDatedAppointments] = useState<Appointment[]>(
    [],
  );
  const [appointments, setAppointments] = useState<
    AppointmentsWithOwnerAndPet[]
  >([]);

  return (
    <CalendarContext.Provider
      value={{
        dateSelected,
        setDateSelected,
        selectedMonth,
        setSelectedMonth,
        datedAppointments,
        setDatedAppointments,
        appointments,
        setAppointments,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);

  if (!context) {
    throw new Error(
      "useCalendar precisa estar dentro do CalendarProvider",
    );
  }

  return context;
}
