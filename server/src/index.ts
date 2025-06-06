/**
 * Application methods
 */
import bootstrap from './bootstrap'
import destroy from './destroy'
import register from './register'

/**
 * Plugin server methods
 */
import config from './config'
import contentTypes from './content-types'
import controllers from './controllers'
import middlewares from './middlewares'
import policies from './policies'
import routes from './routes'
import services from './services'

export default {
  register: register as unknown,
  bootstrap: bootstrap as unknown,
  destroy: destroy as unknown,
  config: config as unknown,
  controllers: controllers as unknown,
  routes: routes as unknown,
  services: services as unknown,
  contentTypes: contentTypes as unknown,
  policies: policies as unknown,
  middlewares: middlewares as unknown,
}
