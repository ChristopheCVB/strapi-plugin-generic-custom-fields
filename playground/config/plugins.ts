import type { Config } from 'strapi-plugin-generic-custom-fields/strapi-server'
import path from 'node:path'
import iconifyIcon from './fields/iconify-icon'
import internalDocument from './fields/internal-document'
import linkTarget from './fields/link-target'

export default {
  'generic-custom-fields': {
    enabled: true,
    resolve: path.dirname(require.resolve('strapi-plugin-generic-custom-fields/package.json')),
    config: {
      customFields: [iconifyIcon, internalDocument, linkTarget],
    } satisfies Config,
  },
}
