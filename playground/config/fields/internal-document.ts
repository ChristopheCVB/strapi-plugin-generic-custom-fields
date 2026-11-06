import type { Core, Modules } from '@strapi/strapi'
import type { Config, ItemResponse } from 'strapi-plugin-generic-custom-fields/strapi-server'
import { getIconifyPreview } from './utils/iconify'

declare const strapi: Core.Strapi

const roots: ItemResponse[] = [
  { value: '/', label: '(/) Home', icon: getIconifyPreview('mdi', 'home') },
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
  async fetchItems({ query }) {
    const filters = query ? { title: { $containsi: query } } : {}
    const [pages, articles] = await Promise.all([
      strapi.documents('api::page.page').findMany({ filters, status: 'published' }),
      strapi.documents('api::article.article').findMany({ filters, status: 'published' }),
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
  async fetchItem({ value }) {
    const root = roots.find(item => item.value === value)
    if (root) return root

    if (value.startsWith('/articles/')) {
      const article = await strapi.documents('api::article.article').findFirst({
        filters: { slug: value.slice('/articles/'.length) },
        status: 'published',
      })
      return article ? articleItem(article) : { value, label: value }
    }

    const page = await strapi.documents('api::page.page').findFirst({
      filters: { slug: value.replace(/^\//, '') },
      status: 'published',
    })
    return page ? pageItem(page) : { value, label: value }
  },
} satisfies Config['customFields'][number]
