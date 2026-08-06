/** Matches Laravel password rules used by POST /users/{id}. */

export type PasswordRuleKey =
  | "minLength"
  | "upperLower"
  | "number"
  | "symbol"
  | "confirmation"

const RULE_MESSAGES: Record<"ar" | "en", Record<PasswordRuleKey, string>> = {
  ar: {
    minLength: "كلمة المرور يجب أن تكون على الأقل 8 أحرف.",
    upperLower: "كلمة المرور يجب أن تحتوي على حرف كبير وصغير على الأقل.",
    number: "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل.",
    symbol: "كلمة المرور يجب أن تحتوي على رمز واحد على الأقل.",
    confirmation: "تأكيد كلمة المرور غير مطابق.",
  },
  en: {
    minLength: "Password must be at least 8 characters.",
    upperLower: "Password must contain at least one uppercase and one lowercase letter.",
    number: "Password must contain at least one number.",
    symbol: "Password must contain at least one symbol.",
    confirmation: "Password confirmation does not match.",
  },
}

export function getPasswordRuleChecks(password: string): Record<Exclude<PasswordRuleKey, "confirmation">, boolean> {
  return {
    minLength: password.length >= 8,
    upperLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  }
}

/**
 * Validate a new password (and optional confirmation).
 * Empty password is treated as "no change" and passes.
 */
export function validateNewPassword(
  password: string,
  confirmation: string,
  locale = "en"
): string | null {
  if (!password) return null

  const lang = locale === "ar" ? "ar" : "en"
  const messages = RULE_MESSAGES[lang]
  const checks = getPasswordRuleChecks(password)
  const failed: string[] = []

  if (!checks.minLength) failed.push(messages.minLength)
  if (!checks.upperLower) failed.push(messages.upperLower)
  if (!checks.number) failed.push(messages.number)
  if (!checks.symbol) failed.push(messages.symbol)
  if (password !== confirmation) failed.push(messages.confirmation)

  return failed.length > 0 ? failed.join(" ") : null
}
