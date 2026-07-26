import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar", "de"],
  defaultLocale: "de",
  localeDetection: false,
})