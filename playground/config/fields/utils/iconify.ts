import type { IconifyInfo, IconifyJSON } from '@iconify/types'
import type { ItemsResponse } from 'strapi-plugin-generic-custom-fields/strapi-server'

import { Buffer } from 'node:buffer'
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import collections from '@iconify/json/collections.json'
import { locate } from '@iconify/json'
import { getIconData } from '@iconify/utils/lib/icon-set/get-icon'
import { iconToSVG } from '@iconify/utils/lib/svg/build'
import { iconToHTML } from '@iconify/utils/lib/svg/html'

type Item = ItemsResponse['items'][number]

const collectionInfo: Record<string, IconifyInfo> = collections
const prefixes = new Set(Object.keys(collectionInfo))
const collectionCache = new Map<string, IconifyJSON>()
let catalogue: Promise<{ names: string[], samples: Item[] }> | undefined

function preview(data: IconifyJSON, name: string): Item['icon'] {
  if (!Object.prototype.hasOwnProperty.call(data.icons, name)
    && !Object.prototype.hasOwnProperty.call(data.aliases ?? {}, name)) {
    return undefined
  }

  const icon = getIconData(data, name)
  if (!icon) {
    return undefined
  }

  const { body, attributes } = iconToSVG(icon)
  const svg = iconToHTML(body, attributes)
  return {
    src: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
    colorMask: true,
  }
}

export function getIconifyPreview(prefix: string, name: string): Item['icon'] {
  if (!prefixes.has(prefix) || !name) {
    return undefined
  }

  let data = collectionCache.get(prefix)
  if (!data) {
    data = JSON.parse(readFileSync(locate(prefix), 'utf8')) as IconifyJSON
    if (collectionCache.size >= 8) {
      collectionCache.delete(collectionCache.keys().next().value!)
    }
    collectionCache.set(prefix, data)
  }

  return preview(data, name)
}

export function getIconifyItem(value: string): Item {
  const [prefix, name, ...rest] = value.split(':')
  return {
    value,
    label: value,
    icon: rest.length ? undefined : getIconifyPreview(prefix, name),
  }
}

function loadCatalogue() {
  catalogue ??= (async () => {
    const names: string[] = []
    const samples: Item[] = []

    for (const [prefix, info] of Object.entries(collectionInfo)) {
      const data = JSON.parse(await readFile(locate(prefix), 'utf8')) as IconifyJSON
      for (const [name, icon] of Object.entries({ ...data.icons, ...data.aliases })) {
        if (!icon.hidden) {
          names.push(`${prefix}:${name}`)
        }
      }

      const sample = info.samples?.[0]
      if (sample) {
        const value = `${prefix}:${sample}`
        samples.push({ value, label: value, icon: preview(data, sample) })
      }
    }

    return { names: names.sort(), samples }
  })().catch((error) => {
    catalogue = undefined
    throw error
  })

  return catalogue
}

export async function getIconifyItems(query?: string): Promise<ItemsResponse> {
  const { names, samples } = await loadCatalogue()
  const terms = query?.trim().toLowerCase().split(/\s+/).filter(Boolean) ?? []
  if (!terms.length) {
    return { items: samples }
  }

  const exact = terms.join(' ')
  const matches = names.filter(name => terms.every(term => name.includes(term)))
  const exactIndex = matches.indexOf(exact)
  if (exactIndex > 0) {
    matches.unshift(...matches.splice(exactIndex, 1))
  }

  return { items: matches.slice(0, 64).map(getIconifyItem) }
}
