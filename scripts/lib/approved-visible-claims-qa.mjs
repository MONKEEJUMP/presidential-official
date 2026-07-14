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
// only complete normalized text nodes in listed placements are exempted.
// Metadata scans must never import this helper.
export const APPROVED_VISIBLE_CLAIMS = JSON.parse(readFileSync(registryPath, 'utf8'))

// Owner-protected visible copy is separate from the legal claim registry.
// It is exempt only at the exact rendered placement named here; metadata
// scanners never import this helper.
const OWNER_PROTECTED_VISIBLE_COPY = [
  {
    claim: "World's Strongest Cannabis!",
    placements: [
      {
        route: '/',
        element: 'p',
        elementId: 'presidential-homepage-statement',
      },
    ],
  },
]

const voidElements = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])

export function normalizeVisibleClaimNode(text) {
  return String(text)
    .replaceAll('&#x27;', "'")
    .replaceAll('&#39;', "'")
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('’', "'")
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
}

function openingElement(tag) {
  const name = tag.match(/^<\s*([a-z0-9-]+)\b/i)?.[1]?.toLowerCase()
  if (!name || tag.startsWith('</') || tag.startsWith('<!') || tag.startsWith('<?')) {
    return null
  }

  const id = tag.match(/\bid\s*=\s*["']([^"']*)["']/i)?.[1]
  return {
    name,
    id: id ? normalizeVisibleClaimNode(id) : '',
    selfClosing: /\/\s*>$/.test(tag) || voidElements.has(name),
  }
}

function placementMatches(placement, route, current, stack) {
  return (
    placement.route === route &&
    placement.element === current?.name &&
    (!placement.elementId || placement.elementId === current.id) &&
    (!placement.ancestorId || stack.some((element) => element.id === placement.ancestorId))
  )
}

function approvedEntryForNode(text, route, current, stack) {
  const normalizedNode = normalizeVisibleClaimNode(text)
  if (!normalizedNode) {
    return undefined
  }

  return [...APPROVED_VISIBLE_CLAIMS.entries, ...OWNER_PROTECTED_VISIBLE_COPY].find(
    (entry) =>
      normalizeVisibleClaimNode(entry.claim) === normalizedNode &&
      entry.placements.some((placement) =>
        placementMatches(placement, route, current, stack),
      ),
  )
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function stripOwnerProtectedElementCopy(html, route) {
  let strippedHtml = String(html)

  for (const entry of OWNER_PROTECTED_VISIBLE_COPY) {
    for (const placement of entry.placements) {
      if (placement.route !== route || !placement.elementId) {
        continue
      }

      const elementName = escapeRegExp(placement.element)
      const elementId = escapeRegExp(placement.elementId)
      const elementPattern = new RegExp(
        `(<${elementName}\\b(?=[^>]*\\bid=["']${elementId}["'])[^>]*>)([\\s\\S]*?)(<\\/${elementName}>)`,
        'gi',
      )

      strippedHtml = strippedHtml.replace(
        elementPattern,
        (match, openingTag, contents, closingTag) =>
          normalizeVisibleClaimNode(String(contents).replace(/<[^>]+>/g, ' ')) ===
          normalizeVisibleClaimNode(entry.claim)
            ? `${openingTag} ${closingTag}`
            : match,
      )
    }
  }

  return strippedHtml
}

export function stripApprovedVisibleClaims(text, placement) {
  if (!placement) {
    return String(text)
  }

  const current = {
    name: placement.element,
    id: placement.elementId ?? '',
  }
  const stack = placement.ancestorId
    ? [{ name: 'approved-ancestor', id: placement.ancestorId }, current]
    : [current]

  return approvedEntryForNode(text, placement.route, current, stack)
    ? ' '
    : String(text)
}

export function stripApprovedVisibleClaimsFromHtml(html, route) {
  const stack = []
  const tokens = stripOwnerProtectedElementCopy(html, route).split(/(<[^>]*>)/g)

  return tokens
    .map((token) => {
      if (!token.startsWith('<')) {
        const current = stack.at(-1)
        if (current?.name === 'script' || current?.name === 'style') {
          return token
        }

        return approvedEntryForNode(token, route, current, stack) ? ' ' : token
      }

      const closingName = token.match(/^<\s*\/\s*([a-z0-9-]+)\b/i)?.[1]?.toLowerCase()
      if (closingName) {
        const matchingIndex = stack.findLastIndex((element) => element.name === closingName)
        if (matchingIndex >= 0) {
          stack.splice(matchingIndex)
        }
        return token
      }

      const element = openingElement(token)
      if (element && !element.selfClosing) {
        stack.push(element)
      }

      return token
    })
    .join('')
}
