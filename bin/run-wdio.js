#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

function run(cmd, args) {
  const res = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  })
  if (res.status !== 0) process.exit(res.status ?? 1)
}

const env =
  process.env.environment ??
  process.env.ENVIRONMENT ??
  process.env.npm_config_environment

if (!env) {
  // eslint-disable-next-line no-console
  console.error(
    'Missing environment. Set environment=staging, ENVIRONMENT=staging, or run: npm test -- --environment=staging'
  )
  process.exit(1)
}

run('npm', ['run', 'clean'])

run('wdio', ['run', `wdio.${env}.conf.js`])
