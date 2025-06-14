import { describe, it, expect, vi, beforeEach } from 'vitest'
import register from '../register'
import { PLUGIN_ID } from '../pluginId'
import type { Core } from '@strapi/strapi'

describe('register', () => {
  const mockStrapi = {
    plugin: vi.fn().mockReturnThis(),
    config: vi.fn(),
    customFields: {
      register: vi.fn(),
    },
  } as unknown as Core.Strapi

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should register custom fields with correct configuration', () => {
    const mockConfig = {
      customFields: [
        {
          name: 'Test Field',
          description: 'A test field',
          icon: 'Star',
          inputSize: {
            default: 6,
            isResizable: true,
          },
        },
      ],
    }

    mockStrapi.config.mockReturnValue(mockConfig.customFields)

    register({ strapi: mockStrapi })

    expect(mockStrapi.plugin).toHaveBeenCalledWith(PLUGIN_ID)
    expect(mockStrapi.config).toHaveBeenCalledWith('customFields')
    expect(mockStrapi.customFields.register).toHaveBeenCalledWith({
      name: 'test-field',
      plugin: PLUGIN_ID,
      type: 'string',
      inputSize: {
        default: 6,
        isResizable: true,
      },
    })
  })

  it('should handle multiple custom fields', () => {
    const mockConfig = {
      customFields: [
        {
          name: 'First Field',
          inputSize: {
            default: 4,
            isResizable: false,
          },
        },
        {
          name: 'Second Field',
          inputSize: {
            default: 8,
            isResizable: true,
          },
        },
      ],
    }

    mockStrapi.config.mockReturnValue(mockConfig.customFields)

    register({ strapi: mockStrapi })

    expect(mockStrapi.customFields.register).toHaveBeenCalledTimes(2)
    expect(mockStrapi.customFields.register).toHaveBeenNthCalledWith(1, {
      name: 'first-field',
      plugin: PLUGIN_ID,
      type: 'string',
      inputSize: {
        default: 4,
        isResizable: false,
      },
    })
    expect(mockStrapi.customFields.register).toHaveBeenNthCalledWith(2, {
      name: 'second-field',
      plugin: PLUGIN_ID,
      type: 'string',
      inputSize: {
        default: 8,
        isResizable: true,
      },
    })
  })

  it('should handle custom fields without optional properties', () => {
    const mockConfig = {
      customFields: [
        {
          name: 'Simple Field',
        },
      ],
    }

    mockStrapi.config.mockReturnValue(mockConfig.customFields)

    register({ strapi: mockStrapi })

    expect(mockStrapi.customFields.register).toHaveBeenCalledWith({
      name: 'simple-field',
      plugin: PLUGIN_ID,
      type: 'string',
      inputSize: undefined,
    })
  })
}) 
