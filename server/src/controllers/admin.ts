import type { Context } from 'koa'
import type { Core } from '@strapi/strapi'
import { type Config, type ItemsResponse, type ItemResponse, itemsResponseSchema, itemResponseSchema } from '../config'
import slugify from 'slugify'
import { PLUGIN_ID } from '../pluginId'

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  getConfigCustomFields() {
    return strapi.plugin(PLUGIN_ID).config<Config['customFields']>('customFields')
  },

  getCustomFieldUID(name: string) {
    return `plugin::${PLUGIN_ID}.${slugify(name, { lower: true })}`
  },

  configCustomFields() {
    return this.getConfigCustomFields()
  },

  configCustomField(ctx: Context): Config['customFields'][number] {
    const customFields = this.getConfigCustomFields()
    const customField = customFields.find((field) => ctx.params.uid === this.getCustomFieldUID(field.name))

    if (!customField) {
      ctx.throw(404, `Custom field ${ctx.params.uid} not found`)
    }

    return customField
  },

  async customFieldItems(ctx: Context): Promise<ItemsResponse> {
    try {
      const customFields = this.getConfigCustomFields()
      const customField = customFields.find((field) => ctx.params.uid === this.getCustomFieldUID(field.name))

      if (!customField) {
        ctx.throw(404, `Custom field ${ctx.params.uid} not found`)
      }

      const query = (ctx.request.query.query as string | undefined)
      const locale = (ctx.request.query.locale as string | undefined)
      // const page = (ctx.request.query.page as string | undefined)
      return itemsResponseSchema.parse(await customField.fetchItems({
        query,
        locale,
        // page: page ? parseInt(page, 10) : undefined,
      }))
    } catch (error) {
      throw error instanceof Error ? error : new Error(`Error fetching CustomField[${ctx.params.uid}] items: ${error}`)
    }
  },

  async customFieldItem(ctx: Context): Promise<ItemResponse> {
    try {
      const customFields = this.getConfigCustomFields()
      const customField = customFields.find((field) => ctx.params.uid === this.getCustomFieldUID(field.name))

      if (!customField) {
        ctx.throw(404, `Custom field ${ctx.params.uid} not found`)
      }

      const value = ctx.request.query.value as string
      const locale = ctx.request.query.locale as string | undefined
      return itemResponseSchema.parse(await customField.fetchItem({ value, locale }))
    } catch (error) {
      throw error instanceof Error ? error : new Error(`Error fetching CustomField[${ctx.params.uid}] item: ${error}`)
    }
  },
})

export default controller
