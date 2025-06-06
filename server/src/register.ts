import type { Core } from '@strapi/strapi'
import { Config } from './config'
import slugify from 'slugify'

const register = ({ strapi }: { strapi: Core.Strapi }) => {
  const configCustomFields = strapi.plugin('generic-custom-fields').config('customFields') as Config['customFields']

  for (const customField of configCustomFields) {
    strapi.customFields.register({
      name: slugify(customField.name, { lower: true }),
      plugin: 'generic-custom-fields',
      type: 'string',
      inputSize: customField.inputSize,
    })
  }
}

export default register
