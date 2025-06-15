import { describe, it, expect } from 'vitest'
import config from '../config'

describe('config validation', () => {
  it('should validate a valid custom field configuration', () => {
    const validConfig = {
      customFields: [
        {
          name: 'Test Field',
          description: 'A test field',
          icon: 'Star',
          inputSize: {
            default: 6,
            isResizable: true,
          },
          fetchItems: () => ({ items: [] }),
          fetchItem: () => ({ value: 'test', label: 'Test' }),
        },
      ],
    }

    expect(() => config.validator(validConfig)).not.toThrow()
  })

  it('should validate a minimal custom field configuration', () => {
    const minimalConfig = {
      customFields: [
        {
          name: 'Simple Field',
          fetchItems: () => ({ items: [] }),
          fetchItem: () => ({ value: 'test', label: 'Test' }),
        },
      ],
    }

    expect(() => config.validator(minimalConfig)).not.toThrow()
  })

  it('should reject invalid icon values', () => {
    const invalidConfig = {
      customFields: [
        {
          name: 'Invalid Field',
          icon: 'InvalidIcon',
          fetchItems: () => ({ items: [] }),
          fetchItem: () => ({ value: 'test', label: 'Test' }),
        },
      ],
    }

    expect(() => config.validator(invalidConfig)).toThrow()
  })

  it('should reject invalid input size values', () => {
    const invalidConfig = {
      customFields: [
        {
          name: 'Invalid Field',
          inputSize: {
            default: 5, // Invalid value, must be 4, 6, 8, or 12
            isResizable: true,
          },
          fetchItems: () => ({ items: [] }),
          fetchItem: () => ({ value: 'test', label: 'Test' }),
        },
      ],
    }

    expect(() => config.validator(invalidConfig)).toThrow()
  })

  it('should reject empty name', () => {
    const invalidConfig = {
      customFields: [
        {
          name: '',
          fetchItems: () => ({ items: [] }),
          fetchItem: () => ({ value: 'test', label: 'Test' }),
        },
      ],
    }

    expect(() => config.validator(invalidConfig)).toThrow()
  })

  it('should reject missing name', () => {
    const invalidConfig = {
      customFields: [
        {
          description: 'A field without a name',
          fetchItems: () => ({ items: [] }),
          fetchItem: () => ({ value: 'test', label: 'Test' }),
        },
      ],
    }

    expect(() => config.validator(invalidConfig)).toThrow()
  })

  it('should reject missing required fetch functions', () => {
    const invalidConfig = {
      customFields: [
        {
          name: 'Missing Functions',
        },
      ],
    }

    expect(() => config.validator(invalidConfig)).toThrow()
  })

  it('should reject field names that would result in duplicate slugified names', () => {
    const invalidConfig = {
      customFields: [
        {
          name: 'Test Field',
          fetchItems: () => ({ items: [] }),
          fetchItem: () => ({ value: 'test', label: 'Test' }),
        },
        {
          name: 'test-field', // Will be slugified to the same as above
          fetchItems: () => ({ items: [] }),
          fetchItem: () => ({ value: 'test', label: 'Test' }),
        },
      ],
    }

    expect(() => config.validator(invalidConfig)).toThrow('Each custom field name must be unique after slugification')
  })
}) 
