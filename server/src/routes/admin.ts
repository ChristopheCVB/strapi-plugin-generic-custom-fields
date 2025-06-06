export default [
  {
    method: 'GET',
    path: '/config/custom-fields',
    handler: 'admin.configCustomFields',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
  {
    method: 'GET',
    path: '/:uid/items',
    handler: 'admin.customFieldItems',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
  {
    method: 'GET',
    path: '/:uid/item',
    handler: 'admin.customFieldItem',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
]
