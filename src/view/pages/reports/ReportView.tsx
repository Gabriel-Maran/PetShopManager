import { ReportParams, ReportType } from "../../../config/consts";
import { useScreen } from "../../../hooks/useScreen";
import MonthlyComparisonReport from "./MonthlyComparisonReport";
import BusiestDaysReport from "./BusiestDaysReport";
import AppointmentOriginReport from "./AppointmentOriginReport";
import AbsentPetsReport from "./AbsentPetsReport";
import ReschedulesReport from "./ReschedulesReport";
import ActivePackagesReport from "./ActivePackagesReport";

export default function ReportView() {
  const { params } = useScreen<ReportParams>();
  switch (params?.type ?? ReportType.MonthlyComparison) {
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
