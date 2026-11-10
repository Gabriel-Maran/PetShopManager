import { useMemo } from "react";
import { todayIso } from "../../../../../utils/datas";
import { useTheme } from "../../../../Themes/ThemeProvider";
import { Calendar } from "react-native-calendars";

interface DatePickerCalendarProps {
  value?: string; // YYYY-MM-DD  (data selecionada)
  onChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
}

export function DatePickerCalendar({
  value,
  onChange,
  minDate,
  maxDate,
}: DatePickerCalendarProps) {
  const { colors } = useTheme();
  const hj = todayIso();

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    // Hoje — quadrado colorido
    marks[hj] = {
      selected: value === hj,
      customStyles: {
        container: {
          backgroundColor: colors.PRIMARY_CONTRAST,
          borderRadius: 4,
          width: 38,
          height: 38,
          alignItems: "center",
          justifyContent: "center",
        },
        text: {
          // A cor do fundo sobre o teal cheio: branco no claro, escuro no escuro; passa 4,5:1 nos dois.
          color: colors.BACKGROUND,
          fontWeight: "bold",
          includeFontPadding: false,
          textAlignVertical: "center",
        },
      },
    };

    // Data selecionada (se for diferente de hoje)
    if (value && value !== hj) {
      marks[value] = {
        selected: true,
        customStyles: {
          container: {
            borderWidth: 2.5,
            borderColor: colors.PRIMARY_CONTRAST,
            backgroundColor: "transparent",
            borderRadius: 4,
            width: 38,
            height: 38,
            alignItems: "center",
            justifyContent: "center",
          },
          text: {
            color: colors.TEXT_SECONDARY,
            includeFontPadding: false,
            textAlignVertical: "center",
          },
        },
      };
    }

    return marks;
  }, [value, hj, colors]);

  return (
    <Calendar
      current={value ?? hj}
      minDate={minDate}
      maxDate={maxDate}
      markingType="custom"
      markedDates={markedDates}
      onDayPress={(day) => onChange(day.dateString)}
      theme={
        {
          backgroundColor: colors.BACKGROUND,
          calendarBackground: colors.BACKGROUND,
          textMonthFontSize: 17,
          textMonthFontWeight: "600",
          monthTextColor: colors.TEXT_SECONDARY,
          textDayHeaderFontSize: 12,
          textSectionTitleColor: colors.TEXT_PRIMARY,
          textDayFontSize: 17,
          dayTextColor: colors.TEXT_SECONDARY,
          selectedDayBackgroundColor: colors.PRIMARY_CONTRAST,
          selectedDayTextColor: colors.BACKGROUND,
          todayTextColor: colors.PRIMARY_CONTRAST,
          textDisabledColor: colors.THIRD_BACKGROUND,
          arrowColor: colors.PRIMARY_CONTRAST,
          "stylesheet.calendar.main": {
            week: { flexDirection: "row", justifyContent: "space-around" },
          },
          "stylesheet.day.basic": {
            base: {
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
            },
            text: {
              marginTop: 0,
              fontSize: 17,
              color: colors.TEXT_SECONDARY,
              includeFontPadding: false,
              textAlignVertical: "center",
            },
          },
        } as any
      }
    />
  );
}
