import type { Core } from '@strapi/strapi'
import { Config } from './config'
import slugify from 'slugify'
import { PLUGIN_ID } from './pluginId'

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  const configCustomFields = strapi.plugin(PLUGIN_ID).config<Config['customFields']>('customFields')

  for (const customField of configCustomFields) {
    strapi.customFields.register({
      name: slugify(customField.name, { lower: true }),
      plugin: PLUGIN_ID,
      type: customField.type || 'string',
      inputSize: customField.inputSize,
    })
  }
}

export default register
