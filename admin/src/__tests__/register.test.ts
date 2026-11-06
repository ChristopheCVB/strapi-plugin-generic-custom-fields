import type { StrapiApp } from '@strapi/strapi/admin'
import { describe, it, expect, vi } from 'vitest'
import plugin from '../index'
import { getTranslation } from '../utils/getTranslation'

const { get } = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('@strapi/strapi/admin', () => ({
  getFetchClient: () => ({ get }),
}))

vi.mock('../components/PluginIcon', () => ({ PluginIcon: () => null }))

describe('admin register', () => {
  it('exposes a native schema default alongside existing settings for every custom field', async () => {
    get.mockResolvedValue({ data: [{ name: 'Country' }, { name: 'Language' }] })
    const app = {
      registerPlugin: vi.fn(),
      customFields: { register: vi.fn() },
    }

    await plugin.register(app as unknown as StrapiApp)

    expect(app.customFields.register).toHaveBeenCalledTimes(2)
    for (const [field] of app.customFields.register.mock.calls) {
      expect(field.type).toBe('string')
      expect(field.options.advanced[0].items).toEqual(expect.arrayContaining([
        {
          name: 'default',
          type: 'text',
          intlLabel: {
            id: 'content-type-builder.form.attribute.settings.default',
            defaultMessage: 'Default value',
          },
          description: {
            id: getTranslation('options.advanced.defaultField.description'),
            defaultMessage: 'Enter the stored item value, not its label',
          },
        },
        ...['required', 'unique', 'private'].map(name => expect.objectContaining({
          name,
          type: 'checkbox',
        })),
      ]))
    }
  })
})
