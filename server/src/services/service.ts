import type { Core } from '@strapi/strapi'

const service = ({ strapi: _strapi }: { strapi: Core.Strapi }) => ({
  getWelcomeMessage() {
    return 'Welcome to Strapi 🚀'
  },
})

export default service
