import type { Config } from '../../server/src/config'
import type { StrapiApp } from '@strapi/strapi/admin'

import { PLUGIN_ID } from './pluginId'
import { Initializer } from './components/Initializer'
import { PluginIcon } from './components/PluginIcon'
import { getFetchClient } from '@strapi/strapi/admin'
import { getTranslation } from './utils/getTranslation'
import slugify from 'slugify'

export default {
  async register(app: StrapiApp) {
    const { get } = getFetchClient()

    const customFields = await get<PickSerializable<Config['customFields'][number]>[]>(`/${PLUGIN_ID}/config/custom-fields`).then(({ data }) => data)
    
    for (const customField of customFields) {
      const customFieldName = slugify(customField.name, { lower: true })
      app.customFields.register({
        name: customFieldName,
        pluginId: PLUGIN_ID,
        type: 'string',
        intlLabel: {
          id: `${PLUGIN_ID}.${customFieldName}.label`,
          defaultMessage: customField.name,
        },
        intlDescription: {
          id: `${PLUGIN_ID}.${customFieldName}.description`,
          defaultMessage: customField.description || customField.name,
        },
        icon: () => PluginIcon({
          icon: customField.icon || 'PuzzlePiece',
        }),
        components: {
          Input: () =>
            // @ts-expect-error module is a React component
            import('./components/Input').then((module) => ({
              default: module.Input,
            })),
        },
        options: {
          advanced: [
            {
              sectionTitle: {
                id: 'global.settings',
                defaultMessage: 'Settings',
              },
              items: [
                {
                  name: 'required',
                  type: 'checkbox',
                  intlLabel: {
                    id: getTranslation('options.advanced.requiredField'),
                    defaultMessage: 'Required field',
                  },
                  description: {
                    id: getTranslation('options.advanced.requiredField.description'),
                    defaultMessage: 'You won\'t be able to create an entry if this field is empty',
                  },
                },
                {
                  name: 'unique',
                  type: 'checkbox',
                  intlLabel: {
                    id: getTranslation('options.advanced.uniqueField'),
                    defaultMessage: 'Unique field',
                  },
                  description: {
                    id: getTranslation('options.advanced.uniqueField.description'),
                    defaultMessage: 'You won\'t be able to create an entry if there is an existing entry with identical content',
                  },
                },
                {
                  name: 'private',
                  type: 'checkbox',
                  intlLabel: {
                    id: getTranslation('options.advanced.privateField'),
                    defaultMessage: 'Private field',
                  },
                  description: {
                    id: getTranslation('options.advanced.privateField.description'),
                    defaultMessage: 'This field will not show up in the API response',
                  },
                },
              ],
            },
          ],
        },
      })
    }

    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      name: PLUGIN_ID,
    })
  },

  registerTrads({ locales }: { locales: string[] }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await import(`./translations/${locale}.json`)

          return { data, locale }
        } catch {
          return { data: {}, locale }
        }
      }),
    )
  },
}
