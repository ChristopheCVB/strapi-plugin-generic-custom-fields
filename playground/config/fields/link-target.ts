import type { Config, ItemsResponse } from 'strapi-plugin-generic-custom-fields/strapi-server'
import { getIconifyPreview } from './utils/iconify'

const items: ItemsResponse['items'] = [
  {
    value: '_self',
    label: 'Same window',
    icon: getIconifyPreview('material-symbols', 'ink-selection-rounded'),
  },
  {
    value: '_blank',
    label: 'New window',
    icon: getIconifyPreview('material-symbols', 'open-in-new'),
  },
]

export default {
  name: 'Link Target',
  description: 'The window in which to open a link',
  icon: 'Link',
  searchable: false,
  fetchItems: () => ({ items }),
  fetchItem: ({ value }) => items.find(item => item.value === value) ?? { value, label: value },
} satisfies Config['customFields'][number]
