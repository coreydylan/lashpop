import assert from "node:assert/strict"
import test from "node:test"
import {
  getVagaroWidgetUrl,
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
