export default [
  {
    method: 'GET',
    path: '/config-custom-fields',
    handler: 'admin.configCustomFields',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
  {
    method: 'GET',
    path: '/:uid/values',
    handler: 'admin.customFieldValues',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
  {
    method: 'GET',
    path: '/:uid/value',
    handler: 'admin.customFieldValue',
    config: {
      policies: ['admin::isAuthenticatedAdmin'],
    },
  },
]
