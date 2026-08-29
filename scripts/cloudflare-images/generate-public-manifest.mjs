import { writeFile } from 'node:fs/promises'
import path from 'node:path'

import {
  PROJECT_ROOT,
  accountHashFromImage,
  buildRuntimeInventory,
  hostedImageDetails,
  loadEnvironment,
} from './lib.mjs'

loadEnvironment()

const inventory = await buildRuntimeInventory()
const siteSources = inventory.filter((item) => item.descriptor.kind === 'site')
const rows = []
let accountHash = null

for (const item of siteSources) {
  const image = await hostedImageDetails(item.imageId)
  if (!image || image.draft) throw new Error(`Hosted image is not ready: ${item.canonical}`)
  accountHash ||= accountHashFromImage(image)
  rows.push([`/${item.descriptor.locator}`, item.imageId])
}

if (!accountHash) throw new Error('Cloudflare Images account hash was not discoverable')

const output = {
  accountHash,
  sources: Object.fromEntries(rows.sort(([left], [right]) => left.localeCompare(right))),
}
const outputPath = path.join(PROJECT_ROOT, 'src/generated/cloudflare-public-images.json')
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`)
process.stdout.write(`${JSON.stringify({ outputPath, sources: rows.length, accountHash }, null, 2)}\n`)
