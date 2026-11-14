import { afterEach, describe, expect, it, vi } from 'vitest'
import field from '../../../../playground/config/fields/internal-document'

afterEach(() => vi.unstubAllGlobals())

describe('Internal Document', () => {
  it.each([
    [undefined, 'Home'],
    ['en', 'Home'],
    ['fr', 'Accueil'],
    ['fr-CA', 'Accueil'],
    ['de', 'Home'],
  ])('uses root labels for locale %s without querying collections to resolve them', async (locale, home) => {
    const documents = vi.fn(() => ({ findMany: vi.fn().mockResolvedValue([]) }))
    vi.stubGlobal('strapi', { documents })
    expect((await field.fetchItem({ value: '/', locale })).label).toBe(`(/) ${home}`)
    expect((await field.fetchItem({ value: '/articles', locale })).label).toBe('(/articles) Articles')
    expect(documents).not.toHaveBeenCalled()
    expect((await field.fetchItems({ locale })).items.map(item => item.label)).toEqual([
      `(/) ${home}`, '(/articles) Articles',
    ])
  })
})

describe.each([undefined, 'en', 'fr'])('Internal Document in locale %s', (locale) => {
  it.each([undefined, 'test'])('searches published Pages and Articles with query %s and sorts their paths', async (query) => {
    const pages = vi.fn().mockResolvedValue([{ slug: 'z', title: 'Z' }, { slug: 'a', title: 'A' }])
    const articles = vi.fn().mockResolvedValue([{ slug: 'news', title: 'News' }])
    const documents = vi.fn((uid: string) => ({ findMany: uid === 'api::page.page' ? pages : articles }))
    vi.stubGlobal('strapi', { documents })
    expect((await field.fetchItems({ query, locale })).items.map(item => item.value)).toEqual([
      '/', '/a', '/z', '/articles', '/articles/news',
    ])
    expect(documents.mock.calls.map(([uid]) => uid)).toEqual(['api::page.page', 'api::article.article'])
    for (const findMany of [pages, articles]) {
      expect(findMany).toHaveBeenCalledWith({ filters: query ? { title: { $containsi: query } } : {}, status: 'published', locale })
    }
  })

  it.each(['/missing', '/articles/missing'])('preserves a deleted or unpublished document: %s', async (value) => {
    const findFirst = vi.fn().mockResolvedValue(null)
    const documents = vi.fn(() => ({ findFirst }))
    vi.stubGlobal('strapi', { documents })
    expect(await field.fetchItem({ value, locale })).toEqual({ value, label: value })
    expect(documents).toHaveBeenCalledWith(value.startsWith('/articles/') ? 'api::article.article' : 'api::page.page')
    expect(findFirst).toHaveBeenCalledWith({ filters: { slug: 'missing' }, status: 'published', locale })
  })

  it.each([
    ['/about', 'api::page.page', '(/about) About'],
    ['/articles/about', 'api::article.article', '(/articles/about) About'],
  ])('resolves a published document: %s', async (value, uid, label) => {
    const findFirst = vi.fn().mockResolvedValue({ slug: 'about', title: 'About' })
    const documents = vi.fn(() => ({ findFirst }))
    vi.stubGlobal('strapi', { documents })
    expect(await field.fetchItem({ value, locale })).toMatchObject({ value, label })
    expect(documents).toHaveBeenCalledWith(uid)
    expect(findFirst).toHaveBeenCalledWith({ filters: { slug: 'about' }, status: 'published', locale })
  })
})
