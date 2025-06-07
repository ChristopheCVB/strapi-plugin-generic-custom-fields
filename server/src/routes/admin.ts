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
    path: '/config/custom-fields/:uid',
    handler: 'admin.configCustomField',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
  {
    method: 'GET',
    path: '/custom-fields/:uid/items',
    handler: 'admin.customFieldItems',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
  {
    method: 'GET',
    path: '/custom-fields/:uid/item',
    handler: 'admin.customFieldItem',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
]
