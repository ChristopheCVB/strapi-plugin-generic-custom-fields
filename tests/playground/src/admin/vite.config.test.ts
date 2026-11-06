import type { Plugin } from 'vitest/config'
import { describe, expect, it } from 'vitest'
import configure from '../../../../playground/src/admin/vite.config'

describe('playground Vite configuration', () => {
  it('keeps existing optimizer exclusions and plugins', () => {
    const existing: Plugin = { name: 'existing' }
    const config = configure({ plugins: [existing], optimizeDeps: { include: ['existing'], exclude: ['existing'] } })
    expect(config.plugins?.[0]).toBe(existing)
    expect(config.optimizeDeps?.exclude).toEqual(['existing', 'prismjs/components'])
    expect(config.optimizeDeps?.include).toContain('existing')
    expect(config.optimizeDeps?.include).toContain('@uidotdev/usehooks')
  })

  it.each([
    '/node_modules/prismjs/components/prism-asmatmel.js',
    '/node_modules/prismjs/components/prism-asmatmel.js?v=123',
    'C:\\node_modules\\prismjs\\components\\prism-asmatmel.js',
  ])('initializes Prism before a grammar executes: %s', (id) => {
    const plugin = configure({}).plugins?.[0] as Plugin
    if (typeof plugin.transform !== 'function') throw new Error('Expected a transform hook')
    expect(Reflect.apply(plugin.transform, {}, ['Prism.languages.test = {}', id])).toBe(
      'import Prism from \'prismjs\';\nPrism.languages.test = {}',
    )
  })

  it.each(['/node_modules/prismjs/components/prism-core.js', '/src/app.ts'])('leaves other modules unchanged: %s', (id) => {
    const plugin = configure({}).plugins?.[0] as Plugin
    if (typeof plugin.transform !== 'function') throw new Error('Expected a transform hook')
    expect(Reflect.apply(plugin.transform, {}, ['source', id])).toBeUndefined()
  })
})
