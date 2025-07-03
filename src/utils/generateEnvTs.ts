import fs from 'fs'
import path from 'path'

const rootPath = path.resolve(__dirname, '../../') // adjust to your project root
const envPath = path.join(rootPath, '.env')
const envTsPath = path.join(rootPath, 'src/config/env.ts') // output path for env.ts

export function generateEnvTs() {
  if (!fs.existsSync(envPath)) {
    console.warn('[envGenerator] .env file not found, skipping env.ts generation.')
    return
  }

  const envLines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/)
  const keys = envLines
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('=')[0])

  // Build TypeScript file content
  const tsContent = keys
    .map(key => `export const ${key} = process.env.${key} || ''`)
    .join('\n') + '\n'

  // Make sure the output folder exists
  const dir = path.dirname(envTsPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(envTsPath, tsContent)
  console.log('[envGenerator] env.ts generated successfully ✅')
}
