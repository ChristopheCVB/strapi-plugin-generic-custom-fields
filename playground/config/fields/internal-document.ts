import type { Core, Modules } from '@strapi/strapi'
import type { Config, ItemResponse } from 'strapi-plugin-generic-custom-fields/strapi-server'
import { getIconifyPreview } from './utils/iconify'

declare const strapi: Core.Strapi

const getRoots = (locale?: string): ItemResponse[] => [
  { value: '/', label: `(/) ${locale?.split('-')[0] === 'fr' ? 'Accueil' : 'Home'}`, icon: getIconifyPreview('mdi', 'home') },
  { value: '/articles', label: '(/articles) Articles', icon: getIconifyPreview('material-symbols', 'newspaper') },
]

const pageItem = (page: Modules.Documents.Result<'api::page.page'>): ItemResponse => ({
  value: `/${page.slug}`,
  label: `(/${page.slug}) ${page.title}`,
  icon: getIconifyPreview('material-symbols', 'file-present'),
})

const articleItem = (article: Modules.Documents.Result<'api::article.article'>): ItemResponse => ({
  value: `/articles/${article.slug}`,
  label: `(/articles/${article.slug}) ${article.title}`,
  icon: getIconifyPreview('material-symbols', 'newspaper'),
})

export default {
  name: 'Internal Document',
  description: 'A published Page or Article',
  icon: 'Paperclip',
  searchable: true,
  async fetchItems({ query, locale }) {
    const roots = getRoots(locale)
    const filters = query ? { title: { $containsi: query } } : {}
    const [pages, articles] = await Promise.all([
      strapi.documents('api::page.page').findMany({ filters, status: 'published', locale }),
      strapi.documents('api::article.article').findMany({ filters, status: 'published', locale }),
    ])
    return {
      items: [
        roots[0],
        ...pages.map(pageItem).sort((a, b) => a.value.localeCompare(b.value)),
        roots[1],
        ...articles.map(articleItem).sort((a, b) => a.value.localeCompare(b.value)),
      ],
    }
  },
  async fetchItem({ value, locale }) {
    const root = getRoots(locale).find(item => item.value === value)
    if (root) return root

    if (value.startsWith('/articles/')) {
      const article = await strapi.documents('api::article.article').findFirst({
        filters: { slug: value.slice('/articles/'.length) },
        status: 'published',
        locale,
      })
      return article ? articleItem(article) : { value, label: value }
    }

    const page = await strapi.documents('api::page.page').findFirst({
      filters: { slug: value.replace(/^\//, '') },
      status: 'published',
      locale,
    })
    return page ? pageItem(page) : { value, label: value }
  },
} satisfies Config['customFields'][number]
