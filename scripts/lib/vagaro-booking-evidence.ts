export function loaderRequestMatches(storedLoader: string, requestUrl: string): boolean {
  const expected = new URL(storedLoader)
  const actual = new URL(requestUrl)
  expected.hash = ''
  actual.hash = ''
  return expected.href === actual.href
}

export function classifyBookingRuntime(evidence: {
  providerErrors: string[]
  selectedServiceVisible: boolean
  unrelatedServiceVisible: boolean
}): 'provider-runtime-blocked' | 'service-selection-confirmed' | 'selection-unconfirmed' {
  if (evidence.providerErrors.length) return 'provider-runtime-blocked'
  if (evidence.selectedServiceVisible && !evidence.unrelatedServiceVisible) {
    return 'service-selection-confirmed'
  }
  return 'selection-unconfirmed'
}
