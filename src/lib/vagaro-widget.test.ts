import assert from "node:assert/strict"
import test from "node:test"
import {
  getVagaroDirectBookingUrl,
  getVagaroWidgetUrl,
  isVagaroDirectBookingUrl,
  resolveVagaroServiceWidgetUrl,
} from "./vagaro-widget"

test("stored service-specific Vagaro URLs keep their original version token", () => {
  const storedUrl = "https://www.vagaro.com//resources/WidgetEmbeddedLoader/example6feO0?v=service-token#"

  assert.equal(
    resolveVagaroServiceWidgetUrl({
      widgetUrl: storedUrl,
      serviceCode: "6feO0",
    }),
    storedUrl,
  )
})

test("service code is used only when a stored URL is unavailable", () => {
  assert.equal(
    resolveVagaroServiceWidgetUrl({ serviceCode: "6faQ0" }),
    getVagaroWidgetUrl("6faQ0"),
  )
})

test("a service without booking metadata does not fall back to all services", () => {
  assert.equal(resolveVagaroServiceWidgetUrl({}), null)
})

test("direct service booking URLs identify a numeric Vagaro service", () => {
  const directUrl = getVagaroDirectBookingUrl("35729654")

  assert.equal(
    directUrl,
    "https://www.vagaro.com/lashpop32/book-now?ServiceId=35729654",
  )
  assert.equal(isVagaroDirectBookingUrl(directUrl), true)
})

test("direct booking URL validation rejects unrelated and unscoped links", () => {
  assert.equal(
    isVagaroDirectBookingUrl("https://example.com/lashpop32/book-now?ServiceId=35729654"),
    false,
  )
  assert.equal(isVagaroDirectBookingUrl("https://www.vagaro.com/lashpop32"), false)
  assert.equal(getVagaroDirectBookingUrl("not-a-service"), null)
})
