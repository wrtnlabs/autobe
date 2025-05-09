export interface IAutoBeConfig {
  /**
   * Locale of the A.I. chatbot.
   *
   * If you configure this property, the A.I. chatbot will conversate with
   * the given locale. You can get the locale value by
   *
   * - Browser: `navigator.language`
   * - NodeJS: `process.env.LANG.split(".")[0]`
   *
   * @default your_locale
   */
  locale?: string;

  /**
   * Timezone of the A.I. chatbot.
   *
   * If you configure this property, the A.I. chatbot will consider the
   * given timezone. You can get the timezone value by
   * `Intl.DateTimeFormat().resolvedOptions().timeZone`.
   *
   * @default your_timezone
   */
  timezone?: string;
}
