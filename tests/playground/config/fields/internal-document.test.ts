import { afterEach, describe, expect, it, vi } from 'vitest'
import field from '../../../../playground/config/fields/internal-document'

afterEach(() => vi.unstubAllGlobals())

describe('Internal Document', () => {
  it('resolves root links without querying collections', async () => {
    const documents = vi.fn()
    vi.stubGlobal('strapi', { documents })
    expect((await field.fetchItem({ value: '/' })).label).toBe('(/) Home')
    expect((await field.fetchItem({ value: '/articles' })).label).toBe('(/articles) Articles')
    expect(documents).not.toHaveBeenCalled()
  })

  it('searches only published Pages and Articles and sorts their paths', async () => {
    const pages = vi.fn().mockResolvedValue([{ slug: 'z', title: 'Z' }, { slug: 'a', title: 'A' }])
    const articles = vi.fn().mockResolvedValue([{ slug: 'news', title: 'News' }])
    const documents = vi.fn((uid: string) => ({ findMany: uid === 'api::page.page' ? pages : articles }))
    vi.stubGlobal('strapi', { documents })
    expect((await field.fetchItems({ query: 'test' })).items.map(item => item.value)).toEqual([
      '/', '/a', '/z', '/articles', '/articles/news',
    ])
    expect(documents.mock.calls.map(([uid]) => uid)).toEqual(['api::page.page', 'api::article.article'])
    for (const findMany of [pages, articles]) {
      expect(findMany).toHaveBeenCalledWith({ filters: { title: { $containsi: 'test' } }, status: 'published' })
    }
  })

  it.each(['/missing', '/articles/missing'])('preserves a deleted or unpublished document: %s', async (value) => {
    const findFirst = vi.fn().mockResolvedValue(null)
    const documents = vi.fn(() => ({ findFirst }))
    vi.stubGlobal('strapi', { documents })
    expect(await field.fetchItem({ value })).toEqual({ value, label: value })
    expect(documents).toHaveBeenCalledWith(value.startsWith('/articles/') ? 'api::article.article' : 'api::page.page')
    expect(findFirst).toHaveBeenCalledWith({ filters: { slug: 'missing' }, status: 'published' })
  })

  it.each([
    ['/about', 'api::page.page', '(/about) About'],
    ['/articles/about', 'api::article.article', '(/articles/about) About'],
  ])('resolves a published document: %s', async (value, uid, label) => {
    const findFirst = vi.fn().mockResolvedValue({ slug: 'about', title: 'About' })
    const documents = vi.fn(() => ({ findFirst }))
    vi.stubGlobal('strapi', { documents })
    expect(await field.fetchItem({ value })).toMatchObject({ value, label })
    expect(documents).toHaveBeenCalledWith(uid)
    expect(findFirst).toHaveBeenCalledWith({ filters: { slug: 'about' }, status: 'published' })
  })
})
