export async function getRouteParam(
  context: any,
  key: string
): Promise<string | undefined> {
  const params =
    typeof context?.params?.then === "function"
      ? await context.params
      : context?.params

  const value = params?.[key]
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}
