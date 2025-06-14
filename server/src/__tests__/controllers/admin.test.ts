import { describe, it, expect, vi, beforeEach } from 'vitest'
import controller from '../../controllers/admin'
import { PLUGIN_ID } from '../../pluginId'
import type { Core } from '@strapi/strapi'
import type { Context } from 'koa'
import type { Config } from '../../config'

describe('admin controller', () => {
  const mockStrapi = {
    plugin: vi.fn().mockReturnThis(),
    config: vi.fn(),
  } as unknown as Core.Strapi

  const mockContext = {
    params: {
      uid: `plugin::${PLUGIN_ID}.test-field`,
    },
    request: {
      query: {},
    },
    throw: vi.fn((status, message) => { throw new Error(message) }),
  } as unknown as Context

  const mockCustomFields: Config['customFields'] = [
    {
      name: 'Test Field',
      description: 'A test field',
      icon: 'Star',
      inputSize: {
        default: 6,
        isResizable: true,
      },
      fetchItems: vi.fn().mockResolvedValue({ items: [] }) as unknown as Config['customFields'][number]['fetchItems'],
      fetchItem: vi.fn().mockResolvedValue({ value: 'test', label: 'Test' }) as unknown as Config['customFields'][number]['fetchItem'],
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockStrapi.config.mockReturnValue(mockCustomFields)
  })

  describe('getConfigCustomFields', () => {
    it('should return custom fields from config', () => {
      const adminController = controller({ strapi: mockStrapi })
      const result = adminController.getConfigCustomFields()

      expect(mockStrapi.plugin).toHaveBeenCalledWith(PLUGIN_ID)
      expect(mockStrapi.config).toHaveBeenCalledWith('customFields')
      expect(result).toEqual(mockCustomFields)
    })
  })

  describe('getCustomFieldUID', () => {
    it('should return correct UID for field name', () => {
      const adminController = controller({ strapi: mockStrapi })
      const result = adminController.getCustomFieldUID('Test Field')

      expect(result).toBe(`plugin::${PLUGIN_ID}.test-field`)
    })
  })

  describe('configCustomFields', () => {
    it('should return custom fields from config', () => {
      const adminController = controller({ strapi: mockStrapi })
      const result = adminController.configCustomFields()

      expect(result).toEqual(mockCustomFields)
    })
  })

  describe('configCustomField', () => {
    it('should return custom field by UID', () => {
      const adminController = controller({ strapi: mockStrapi })
      const result = adminController.configCustomField(mockContext)

      expect(result).toEqual(mockCustomFields[0])
    })

    it('should throw 404 if field not found', () => {
      const adminController = controller({ strapi: mockStrapi })
      const context = {
        ...mockContext,
        params: { uid: `plugin::${PLUGIN_ID}.non-existent-field` },
      } as unknown as Context

      expect(() => adminController.configCustomField(context)).toThrow(`Custom field plugin::${PLUGIN_ID}.non-existent-field not found`)
    })
  })

  describe('customFieldItems', () => {
    it('should return items from fetchItems', async () => {
      const adminController = controller({ strapi: mockStrapi })
      const result = await adminController.customFieldItems(mockContext)

      expect(mockCustomFields[0].fetchItems).toHaveBeenCalledWith({ query: undefined })
      expect(result).toEqual({ items: [] })
    })

    it('should pass query parameter to fetchItems', async () => {
      const adminController = controller({ strapi: mockStrapi })
      const context = {
        ...mockContext,
        request: { query: { query: 'test' } },
      } as unknown as Context

      await adminController.customFieldItems(context)

      expect(mockCustomFields[0].fetchItems).toHaveBeenCalledWith({ query: 'test' })
    })

    it('should throw 404 if field not found', async () => {
      const adminController = controller({ strapi: mockStrapi })
      const context = {
        ...mockContext,
        params: { uid: `plugin::${PLUGIN_ID}.non-existent-field` },
      } as unknown as Context

      await expect(adminController.customFieldItems(context)).rejects.toThrow(`Custom field plugin::${PLUGIN_ID}.non-existent-field not found`)
    })

    it('should propagate errors from fetchItems', async () => {
      const adminController = controller({ strapi: mockStrapi })
      const context = {
        ...mockContext,
        request: { query: { query: 'test' } },
      } as unknown as Context
      const error = new Error('fetchItems error')
      mockCustomFields[0].fetchItems.mockRejectedValue(error)
      await expect(adminController.customFieldItems(context)).rejects.toThrow('fetchItems error')
    })
  })

  describe('customFieldItem', () => {
    it('should return item from fetchItem', async () => {
      const adminController = controller({ strapi: mockStrapi })
      const context = {
        ...mockContext,
        request: { query: { value: 'test' } },
      } as unknown as Context

      const result = await adminController.customFieldItem(context)

      expect(mockCustomFields[0].fetchItem).toHaveBeenCalledWith({ value: 'test' })
      expect(result).toEqual({ value: 'test', label: 'Test' })
    })

    it('should throw 404 if field not found', async () => {
      const adminController = controller({ strapi: mockStrapi })
      const context = {
        ...mockContext,
        params: { uid: `plugin::${PLUGIN_ID}.non-existent-field` },
        request: { query: { value: 'test' } },
      } as unknown as Context

      await expect(adminController.customFieldItem(context)).rejects.toThrow(`Custom field plugin::${PLUGIN_ID}.non-existent-field not found`)
    })
  })
}) 
