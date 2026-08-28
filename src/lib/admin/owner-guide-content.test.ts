import { strict as assert } from "node:assert"
import { test } from "node:test"
import capabilities from "../../../docs/admin/capabilities.json"
import { OWNER_GUIDE_ARTICLES, searchOwnerGuide } from "./owner-guide-content"

test("every Admin owner job has one searchable guide", () => {
  const guideCapabilities = new Set(OWNER_GUIDE_ARTICLES.map((article) => article.capabilityId))
  assert.equal(guideCapabilities.size, capabilities.capabilities.length)
  for (const capability of capabilities.capabilities) {
    assert.equal(guideCapabilities.has(capability.id), true, `Missing ${capability.id}`)
  }
})

test("plain-language searches find the expected owner task", () => {
  assert.equal(searchOwnerGuide("change a team photo")[0]?.id, "team-photography")
  assert.equal(searchOwnerGuide("add a service").some((article) => article.id === "launch-service"), true)
  assert.equal(searchOwnerGuide("unsubscribed").some((article) => article.id === "newsletter"), true)
  assert.equal(searchOwnerGuide("who changed something").some((article) => article.id === "activity-history"), true)
})

test("work-area filters contain only guides from that area", () => {
  const media = searchOwnerGuide("", "Media")
  assert.equal(media.length > 0, true)
  assert.equal(media.every((article) => article.area === "Media"), true)
})

test("every guide provides steps, checks and a real Admin route", () => {
  for (const article of OWNER_GUIDE_ARTICLES) {
    assert.equal(article.steps.length >= 3, true, article.id)
    assert.equal(article.check.length >= 2, true, article.id)
    assert.match(article.route, /^\/admin/)
  }
})
