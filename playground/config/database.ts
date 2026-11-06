import type { Core } from '@strapi/strapi'
import path from 'node:path'

export default ({ env }: Core.Config.Shared.ConfigParams) => ({
  connection: {
    client: 'sqlite',
    connection: {
      filename: path.resolve(env('DATABASE_FILENAME', '.tmp/data.db')),
    },
    useNullAsDefault: true,
  },
})
