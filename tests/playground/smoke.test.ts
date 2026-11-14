import type { Config } from 'strapi-plugin-generic-custom-fields/strapi-server'
import type { Core } from '@strapi/strapi'
import { randomBytes } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { expect, it, vi } from 'vitest'

it('boots the built playground with three fields, three collections, offline icons and HTTP endpoints', async () => {
  const appDir = path.resolve(__dirname, '../../playground')
  const directory = await mkdtemp(path.join(tmpdir(), 'generic-custom-fields-'))
  const environment = {
    NODE_ENV: 'production',
    STRAPI_TELEMETRY_DISABLED: 'true',
    DATABASE_FILENAME: path.join(directory, 'smoke.db'),
    HOST: '127.0.0.1',
    PORT: '0',
    APP_KEYS: `${randomBytes(32).toString('hex')},${randomBytes(32).toString('hex')}`,
    ...Object.fromEntries([
      'ADMIN_JWT_SECRET', 'API_TOKEN_SALT', 'TRANSFER_TOKEN_SALT', 'ENCRYPTION_KEY',
    ].map(key => [key, randomBytes(32).toString('hex')])),
  }
  for (const [key, value] of Object.entries(environment)) vi.stubEnv(key, value)

  let app: Core.Strapi | undefined
  try {
    // Use the same CommonJS entrypoint as Strapi's CLI.
    const { createStrapi }: typeof import('@strapi/strapi') = createRequire(path.join(appDir, 'package.json'))('@strapi/strapi')
    app = createStrapi({ appDir, distDir: path.join(appDir, 'dist') })
    await app.load()
    const fields = app.plugin('generic-custom-fields').config<Config['customFields']>('customFields')
    expect(fields.map(field => field.name)).toEqual(['Iconify Icon', 'Internal Document', 'Link Target'])
    expect(Object.keys(app.get<{ getAll: () => Record<string, unknown> }>('custom-fields').getAll()).sort()).toEqual([
      'plugin::generic-custom-fields.iconify-icon',
      'plugin::generic-custom-fields.internal-document',
      'plugin::generic-custom-fields.link-target',
    ])
    expect(Object.keys(app.contentTypes).filter(uid => uid.startsWith('api::')).sort()).toEqual([
      'api::article.article', 'api::page.page', 'api::showcase.showcase',
    ])
    for (const uid of ['api::page.page', 'api::article.article', 'api::showcase.showcase'] as const) {
      expect(await app.documents(uid).count({})).toBe(0)
    }
    expect(await app.db.query('admin::user').count()).toBe(0)

    const [icons, documents, targets] = fields
    expect((await targets.fetchItems({})).items.map(item => item.value)).toEqual(['_self', '_blank'])
    expect((await targets.fetchItem({ value: '_blank' })).label).toBe('New window')
    expect((await targets.fetchItem({ value: 'unknown' })).value).toBe('unknown')
    expect((await documents.fetchItems({})).items.map(item => item.value)).toEqual(['/', '/articles'])
    expect((await documents.fetchItem({ value: '/' })).label).toBe('(/) Home')
    for (const value of ['/missing', '/articles/missing']) {
      expect(await documents.fetchItem({ value })).toEqual({ value, label: value })
    }

    const locales = app.plugin('i18n').service('locales')
    await locales.create({ code: 'fr', name: 'French (fr)' })
    for (const [uid, type, prefix] of [
      ['api::page.page', 'page', '/'],
      ['api::article.article', 'article', '/articles/'],
    ] as const) {
      const published = await app.documents(uid).create({
        locale: 'en', status: 'published', data: { title: `English ${type}`, slug: `${type}-en` },
      })
      await app.documents(uid).update({
        documentId: published.documentId, locale: 'fr', status: 'published',
        data: { title: `French ${type}`, slug: `${type}-fr` },
      })
      const untranslated = await app.documents(uid).create({
        locale: 'en', status: 'published', data: { title: `Untranslated ${type}`, slug: `${type}-draft-en` },
      })
      await app.documents(uid).update({
        documentId: untranslated.documentId, locale: 'fr', status: 'draft',
        data: { title: `French draft ${type}`, slug: `${type}-draft-fr` },
      })
      expect((await documents.fetchItem({ value: `${prefix}${type}-fr`, locale: 'fr' })).label)
        .toBe(`(${prefix}${type}-fr) French ${type}`)
      for (const slug of [`${type}-en`, `${type}-draft-fr`]) {
        const value = `${prefix}${slug}`
        expect(await documents.fetchItem({ value, locale: 'fr' })).toEqual({ value, label: value })
      }
    }
    expect((await documents.fetchItems({ locale: 'en' })).items.map(item => item.value)).toEqual([
      '/', '/page-draft-en', '/page-en', '/articles', '/articles/article-draft-en', '/articles/article-en',
    ])
    const frenchPaths = ['/', '/page-fr', '/articles', '/articles/article-fr']
    expect((await documents.fetchItems({ locale: 'fr' })).items.map(item => item.value)).toEqual(frenchPaths)
    expect((await documents.fetchItems({ locale: 'fr', query: 'English' })).items.map(item => item.value))
      .toEqual(['/', '/articles'])
    await locales.setDefaultLocale({ code: 'fr' })
    expect((await documents.fetchItems({})).items.map(item => item.value)).toEqual(frenchPaths)
    expect((await documents.fetchItems({})).items[0].label).toBe('(/) Home')
    expect((await documents.fetchItem({ value: '/page-fr' })).label).toBe('(/page-fr) French page')
    expect((await documents.fetchItem({ value: '/articles/article-fr' })).label)
      .toBe('(/articles/article-fr) French article')

    expect((await icons.fetchItems({})).items.length).toBeGreaterThan(0)
    const search = await icons.fetchItems({ query: 'mdi:home' })
    expect(search.items.length).toBeGreaterThan(0)
    expect(search.items.length).toBeLessThanOrEqual(64)
    expect(search.items[0].value).toBe('mdi:home')
    expect(search.items[0].icon?.src).toMatch(/^data:image\/svg\+xml;base64,/)
    expect((await icons.fetchItem({ value: 'mdi:home' })).icon?.colorMask).toBe(true)

    const server = app.server
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve)
    })
    const address = app.server.httpServer.address()
    if (!address || typeof address === 'string') throw new Error('Expected a TCP listener')
    const base = `http://127.0.0.1:${address.port}`
    expect((await fetch(`${base}/_health`, { signal: AbortSignal.timeout(10000) })).status).toBe(204)
    expect((await fetch(`${base}/admin`, { signal: AbortSignal.timeout(10000) })).status).toBe(200)
    expect((await fetch(`${base}/favicon.ico`, { signal: AbortSignal.timeout(10000) })).status).toBe(200)
    const response = await fetch(`${base}/generic-custom-fields/config/custom-fields`, {
      signal: AbortSignal.timeout(10000),
    })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(fields.map(({ name, description, icon }) => ({ name, description, icon })))
  } finally {
    try {
      await app?.destroy()
    } finally {
      vi.unstubAllEnvs()
      await rm(directory, { recursive: true, force: true })
    }
  }
})
