import { ReportType } from "../../../config/consts";
import MonthlyComparisonReport from "./MonthlyComparisonReport";
import BusiestDaysReport from "./BusiestDaysReport";
import AppointmentOriginReport from "./AppointmentOriginReport";
import AbsentPetsReport from "./AbsentPetsReport";
import ReschedulesReport from "./ReschedulesReport";
import ActivePackagesReport from "./ActivePackagesReport";

export default function ReportView({ route }: { route: ReportType }) {
  switch (route) {
    case ReportType.BusiestDaysAndHours:
      return <BusiestDaysReport />;
    case ReportType.AppointmentOrigin:
      return <AppointmentOriginReport />;
    case ReportType.AbsentPets:
      return <AbsentPetsReport />;
    case ReportType.Reschedules:
      return <ReschedulesReport />;
    case ReportType.MonthlyComparison:
      return <MonthlyComparisonReport />;
    case ReportType.Packages:
      return <ActivePackagesReport />;
    default:
      return <BusiestDaysReport />;
  }
}
