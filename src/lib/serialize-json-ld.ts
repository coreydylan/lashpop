/**
 * Serialize JSON-LD for an inline script without allowing user-controlled
 * strings to terminate the script element. JSON.stringify alone does not
 * escape `<`, so external review/content data must always use this helper.
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
