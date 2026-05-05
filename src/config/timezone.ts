import {
  addHours,
  format,
  parseISO,
  setHours,
  setMinutes,
  subHours,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export const DEFAULT_TIMEZONE = "America/Sao_Paulo";
export const DEFAULT_TENANT_TIMEZONE = "America/Sao_Paulo";

export type TenantTimezoneConfig = {
  timezone: string;
  displayName: string;
  offset: string;
};

export const BRAZIL_TIMEZONES: TenantTimezoneConfig[] = [
  { timezone: "America/Sao_Paulo", displayName: "São Paulo (UTC-3)", offset: "-03:00" },
  { timezone: "America/Manaus", displayName: "Manaus (UTC-4)", offset: "-04:00" },
  { timezone: "America/Rio_Branco", displayName: "Rio Branco (UTC-5)", offset: "-05:00" },
  { timezone: "America/Fortaleza", displayName: "Fortaleza (UTC-3)", offset: "-03:00" },
  { timezone: "America/Recife", displayName: "Recife (UTC-3)", offset: "-03:00" },
  { timezone: "America/Bahia", displayName: "Salvador (UTC-3)", offset: "-03:00" },
];

export function isUTCEnvironment() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return timezone === "UTC" || timezone === "GMT";
}

export function createDateInTimezone(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  timezone = DEFAULT_TIMEZONE,
) {
  const baseDate = new Date(year, month, day);
  const dateWithTime = setMinutes(setHours(baseDate, hour), minute);

  if (isUTCEnvironment()) {
    return addHours(dateWithTime, 3);
  }

  return dateWithTime;
}

export function toISOStringInTimezone(
  date: Date,
  timezone = DEFAULT_TIMEZONE,
) {
  if (isUTCEnvironment()) {
    return subHours(date, 3).toISOString();
  }

  return date.toISOString();
}

export function adjustDateForEnvironment(
  date: Date,
  targetTimezone = DEFAULT_TIMEZONE,
) {
  if (isUTCEnvironment()) {
    return addHours(date, 3);
  }

  return date;
}

export function formatInTimezone(
  date: Date,
  formatString = "HH:mm",
  timezone = DEFAULT_TIMEZONE,
) {
  if (isUTCEnvironment()) {
    return format(addHours(date, 3), formatString, { locale: ptBR });
  }

  return format(date, formatString, { locale: ptBR });
}

export function fromISOStringInTimezone(
  isoString: string,
  timezone = DEFAULT_TIMEZONE,
) {
  const date = parseISO(isoString);

  if (isUTCEnvironment()) {
    return addHours(date, 3);
  }

  return date;
}

export function getCurrentTimezone(tenantData?: { timezone?: string | null }) {
  if (tenantData?.timezone) {
    return tenantData.timezone;
  }

  const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (!systemTimezone || systemTimezone === "UTC") {
    return DEFAULT_TENANT_TIMEZONE;
  }

  return systemTimezone;
}

export function getTenantTimezone(tenantData?: {
  timezone?: string | null;
}): TenantTimezoneConfig {
  const timezone = tenantData?.timezone || DEFAULT_TENANT_TIMEZONE;
  const config = BRAZIL_TIMEZONES.find((item) => item.timezone === timezone);

  return (
    config || {
      timezone: DEFAULT_TENANT_TIMEZONE,
      displayName: "São Paulo (UTC-3)",
      offset: "-03:00",
    }
  );
}
