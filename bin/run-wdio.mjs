#!/usr/bin/env node
const env =
  process.env.environment ??
  process.env.ENVIRONMENT ??
  process.env.npm_config_environment ??
  'dev'

const { spawnSync } = await import('node:child_process')

const r = spawnSync('wdio', ['run', `wdio.${env}.conf.js`], {
  stdio: 'inherit',
  shell: process.platform === 'win32'
})

process.exit(r.status ?? 1)
