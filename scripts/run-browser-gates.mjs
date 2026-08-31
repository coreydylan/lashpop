import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { resolve } from 'node:path'

const root = process.cwd()
const nextBin = resolve(root, 'node_modules/.bin/next')
const playwrightBin = resolve(root, 'node_modules/.bin/playwright')

function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : null
      server.close((error) => {
        if (error) reject(error)
        else if (!port) reject(new Error('Could not reserve a browser-gate port'))
        else resolvePort(port)
      })
    })
  })
}

function run(command, args, env) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env,
      stdio: 'inherit',
    })
    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (code === 0) resolveRun()
      else reject(new Error(`${command} exited with ${signal || code}`))
    })
  })
}

async function waitForServer(url, child) {
  const deadline = Date.now() + 120_000
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Next server exited before it became ready (${child.exitCode})`)
    }
    try {
      const response = await fetch(url, { redirect: 'manual' })
      if (response.status >= 200 && response.status < 500) return
    } catch {
      // The port is not listening yet.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250))
  }
  throw new Error(`Next server did not become ready within 120 seconds: ${url}`)
}

async function stopServer(child) {
  if (child.exitCode !== null) return
  child.kill('SIGTERM')
  await Promise.race([
    new Promise((resolveExit) => child.once('exit', resolveExit)),
    new Promise((resolveWait) => setTimeout(resolveWait, 5_000)),
  ])
  if (child.exitCode === null) child.kill('SIGKILL')
}

async function main() {
  const port = await freePort()
  const baseUrl = `http://127.0.0.1:${port}`
  const env = {
    ...process.env,
    PLAYWRIGHT_BASE_URL: baseUrl,
  }
  const server = spawn(nextBin, ['start', '-H', '127.0.0.1', '-p', String(port)], {
    cwd: root,
    env,
    stdio: 'inherit',
  })

  try {
    await waitForServer(baseUrl, server)
    // Keep fixture-backed production rendering below the point where parallel
    // RSC streams can starve hydration and create false visual differences.
    await run(playwrightBin, [
      'test',
      '--project=visual-desktop',
      '--project=visual-mobile',
      '--project=visual-narrow',
      '--workers=1',
    ], env)
    // Quiz result photos are remote hosted assets; one retry covers a cold
    // image request without accepting a changed accessibility result.
    await run(playwrightBin, [
      'test',
      '--project=accessibility',
      '--workers=1',
      '--retries=1',
    ], env)
  } finally {
    await stopServer(server)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
