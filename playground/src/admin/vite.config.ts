import type { ViteUserConfig } from 'vitest/config'

export default (config: ViteUserConfig) => {
  // shortcut: Strapi 5.61 grammars assume global Prism, remove when upstream fixes initialization.
  config.optimizeDeps = {
    ...config.optimizeDeps,
    include: [...(config.optimizeDeps?.include ?? []), '@strapi/strapi/admin', '@strapi/icons', '@uidotdev/usehooks', 'slugify'],
    exclude: [...(config.optimizeDeps?.exclude ?? []), 'prismjs/components'],
  }
  config.plugins ??= []
  config.plugins.push({
    name: 'prism-grammar-imports',
    enforce: 'pre',
    transform(source, id) {
      if (/[/\\]prismjs[/\\]components[/\\]prism-(?!core)[^/\\]+\.js$/.test(id.split('?')[0])) {
        return `import Prism from 'prismjs';\n${source}`
      }
    },
  })
  return config
}
