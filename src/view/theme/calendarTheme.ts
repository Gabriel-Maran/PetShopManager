import type { CalendarProps } from "react-native-calendars";

/**
 * O tema do react-native-calendars. A biblioteca aceita trocar os estilos internos pelas chaves
 * "stylesheet.calendar.header" e afins, mas o tipo dela não as declara.
 */
export type CalendarTheme = NonNullable<CalendarProps["theme"]> & {
  [key: `stylesheet.${string}`]: object;
};
