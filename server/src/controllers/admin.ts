import type { Context } from 'koa'
import type { Core } from '@strapi/strapi'
import { type Config, type fetchItemsReturn, type fetchItemReturn, fetchItemsReturnSchema, fetchItemReturnSchema } from '../config'
import slugify from 'slugify'

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  getConfigCustomFields() {
    return strapi.plugin('generic-custom-fields').config('customFields') as Config['customFields']
  },

  configCustomFields() {
    return this.getConfigCustomFields()
  },

  async customFieldValues(ctx: Context): Promise<fetchItemsReturn> {
    try {
      const customFields = this.getConfigCustomFields()
      const customField = customFields.find((field) => ctx.params.uid === `plugin::generic-custom-fields.${slugify(field.name, { lower: true })}`)
      if (!customField) {
        throw new Error(`Custom field ${ctx.params.uid} not found`)
      }
      const query = ctx.request.query.query as string || ''
      const externalResults = await customField.fetchItems(query)
      if (fetchItemsReturnSchema.safeParse(externalResults).success) {
        return externalResults
      } else {
        throw new Error(`Invalid data format returned from fetchItems from custom field ${customField.name}`)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error fetching CustomField[${ctx.params.uid}] values:`, error)
      throw new Error(`Error fetching CustomField[${ctx.params.uid}]`)
    }
  },

  async customFieldValue(ctx: Context): Promise<fetchItemReturn> {
    try {
      const customFields = this.getConfigCustomFields()
      const customField = customFields.find((field) => ctx.params.uid === `plugin::generic-custom-fields.${slugify(field.name, { lower: true })}`)
      if (!customField) {
        throw new Error(`Custom field ${ctx.params.uid} not found`)
      }
      const id = ctx.request.query.id as string
      const externalResult = await customField.fetchItem(id)
      if (fetchItemReturnSchema.safeParse(externalResult).success) {
        return externalResult
      } else {
        throw new Error(`Invalid data format returned from fetchItem from custom field ${customField.name}`)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error fetching CustomField[${ctx.params.uid}] value:`, error)
      throw new Error(`Error fetching CustomField[${ctx.params.uid}]`)
    }
  },
})

export default controller
