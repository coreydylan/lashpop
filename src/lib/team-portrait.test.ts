import { strict as assert } from "node:assert"
import { test } from "node:test"

import { resolveTeamPhotoParity } from "./team-portrait"

test("Vagaro wins exactly as it does on the public homepage", () => {
  const result = resolveTeamPhotoParity({
    vagaroPhotoUrl: "https://vagaro.example/nancy.jpeg",
    imageUrl: "https://r2.example/missing-nancy.jpg",
    primaryPhotoId: "nancy-primary",
    primaryPhotoPath: "https://r2.example/missing-nancy.jpg",
  })

  assert.equal(result.effectiveImageUrl, "https://vagaro.example/nancy.jpeg")
  assert.equal(result.effectiveImageSource, "vagaro")
  assert.equal(result.hasLocalPrimary, true)
  assert.equal(result.localPrimaryIsLive, false)
})

test("a Vagaro portrait remains live when no local primary is selected", () => {
  const result = resolveTeamPhotoParity({
    vagaroPhotoUrl: "https://vagaro.example/paige.jpeg",
    imageUrl: "/placeholder-team.svg",
  })

  assert.equal(result.effectiveImageUrl, "https://vagaro.example/paige.jpeg")
  assert.equal(result.effectiveImageSource, "vagaro")
  assert.equal(result.hasLocalPrimary, false)
  assert.equal(result.hasRequiredLocalCrops, false)
})

test("off-Vagaro members use their local portrait and report parity", () => {
  const localUrl = "https://r2.example/local-profile.jpg"
  const result = resolveTeamPhotoParity({
    imageUrl: localUrl,
    primaryPhotoId: "local-primary",
    primaryPhotoPath: localUrl,
    cropSquareUrl: "https://r2.example/local-square.jpg",
    cropCloseUpCircleUrl: "https://r2.example/local-circle.jpg",
  })

  assert.equal(result.effectiveImageUrl, localUrl)
  assert.equal(result.effectiveImageSource, "local")
  assert.equal(result.localPrimaryIsLive, true)
  assert.equal(result.hasRequiredLocalCrops, true)
})

test("empty portrait fields resolve to the same branded placeholder", () => {
  const result = resolveTeamPhotoParity({ imageUrl: "  " })

  assert.equal(result.effectiveImageUrl, "/placeholder-team.svg")
  assert.equal(result.effectiveImageSource, "placeholder")
})
