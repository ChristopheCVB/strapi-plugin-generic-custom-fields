import type { Config } from 'strapi-plugin-generic-custom-fields/strapi-server'
import { getIconifyItem, getIconifyItems } from './utils/iconify'

export default {
  name: 'Iconify Icon',
  description: 'An Iconify icon',
  icon: 'Image',
  searchable: true,
  fetchItems: ({ query }) => getIconifyItems(query),
  fetchItem: ({ value }) => getIconifyItem(value),
} satisfies Config['customFields'][number]
