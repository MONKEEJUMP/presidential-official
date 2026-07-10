import {readFileSync} from 'node:fs'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const registryPath = resolve(
  here,
  '..',
  '..',
  'src',
  'lib',
  'seo',
  'source-records',
  'approved-visible-claims.json',
)

// AUTH-2 (5521-FABL) approved-visible-claims registry. Default stays DENY:
// only EXACT registry strings are exempted, only from VISIBLE-copy scans.
// Metadata scans must never import this helper.
export const APPROVED_VISIBLE_CLAIMS = JSON.parse(readFileSync(registryPath, 'utf8'))

function normalize(text) {
  return String(text)
    .replaceAll('&#x27;', "'")
    .replaceAll('&#39;', "'")
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&')
    .replaceAll('’', "'")
}

export function stripApprovedVisibleClaims(text) {
  let result = normalize(text)
  for (const entry of APPROVED_VISIBLE_CLAIMS.entries) {
    result = result.split(normalize(entry.claim)).join(' ')
  }
  return result
}