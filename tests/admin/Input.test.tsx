import { useState } from 'react'
import { DesignSystemProvider } from '@strapi/design-system'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import Input from '../../admin/src/components/Input'
import { PLUGIN_ID } from '../../admin/src/pluginId'
import type { ItemResponse } from '../../server/src/config'

const { get, useQueryParams } = vi.hoisted(() => ({
  get: vi.fn(),
  useQueryParams: vi.fn(),
}))

vi.mock('@strapi/strapi/admin', () => ({
  useFetchClient: () => ({ get }),
  useQueryParams,
}))

const uid = `plugin::${PLUGIN_ID}.country`
const configPath = `/${PLUGIN_ID}/config/custom-fields/${uid}`
const itemsPath = `/${PLUGIN_ID}/custom-fields/${uid}/items`
const itemPath = `/${PLUGIN_ID}/custom-fields/${uid}/item`
let items: ItemResponse[]
let searchable: boolean

interface TestFieldProps {
  initialValue?: string
  disabled?: boolean
  error?: string
  onChange?: (event: { target: { name: string, value: string } }) => void
}

function TestField({ initialValue = '', disabled, error, onChange }: TestFieldProps) {
  const [value, setValue] = useState(initialValue)
  const fieldProps = {
    name: 'country',
    type: 'string' as const,
    label: 'Country',
    hint: 'Choose a country',
    attribute: { customField: uid },
    value,
    disabled,
    error,
    onChange: (event: { target: { name: string, value: string } }) => {
      onChange?.(event)
      setValue(event.target.value)
    },
  }

  return <DesignSystemProvider><Input {...fieldProps} /></DesignSystemProvider>
}

beforeEach(() => {
  items = [
    { value: 'FR', label: 'France' },
    { value: 'DE', label: 'Germany' },
  ]
  searchable = false
  useQueryParams.mockReturnValue([{ query: {} }])
  get.mockReset().mockImplementation((path: string) => {
    const url = new URL(path, window.location.origin)
    if (url.pathname === configPath) {
      return Promise.resolve({ data: { searchable } })
    }
    if (url.pathname === itemsPath) {
      const query = url.searchParams.get('query')?.toLowerCase()
      return Promise.resolve({
        data: { items: items.filter(item => !query || item.label.toLowerCase().includes(query)) },
      })
    }
    if (url.pathname === itemPath) {
      return Promise.resolve({ data: { value: 'ES', label: 'Spain' } })
    }
    throw new Error(`Unexpected request: ${path}`)
  })
})

describe('Input in Chromium', () => {
  it('shows loading until configuration and items arrive, then opens the real options', async () => {
    const config = Promise.withResolvers<{ data: { searchable: boolean } }>()
    const response = Promise.withResolvers<{ data: { items: ItemResponse[] } }>()
    get.mockReturnValueOnce(config.promise).mockReturnValueOnce(response.promise)

    await render(<TestField />)
    await expect.element(page.getByRole('textbox', { name: 'Country' })).toBeDisabled()
    await expect.element(page.getByRole('combobox')).not.toBeInTheDocument()
    config.resolve({ data: { searchable: false } })
    await expect.poll(() => get.mock.calls.length).toBe(2)
    await expect.element(page.getByRole('textbox', { name: 'Country' })).toBeDisabled()
    response.resolve({ data: { items } })

    await page.getByRole('combobox', { name: 'Country' }).click()
    await expect.element(page.getByRole('option', { name: 'France' })).toBeVisible()
    await expect.element(page.getByRole('option', { name: 'Germany' })).toBeVisible()
    await expect.element(page.getByRole('combobox', { name: 'Country' })).toHaveAccessibleDescription('Choose a country')
    expect(get.mock.calls.map(([path]) => path)).toEqual([`${configPath}?`, `${itemsPath}?`])
  })

  it('selects a stored value and clears it through the field onChange contract', async () => {
    const onChange = vi.fn()
    await render(<TestField onChange={onChange} />)
    await page.getByRole('combobox', { name: 'Country' }).click()
    await page.getByRole('option', { name: 'France' }).click()

    expect(onChange).toHaveBeenLastCalledWith({ target: { name: 'country', value: 'FR' } })
    await expect.element(page.getByRole('combobox', { name: 'Country' })).toHaveValue('France')
    await page.getByRole('button', { name: 'Clear' }).click()
    expect(onChange).toHaveBeenLastCalledWith({ target: { name: 'country', value: '' } })
    await expect.element(page.getByRole('combobox', { name: 'Country' })).toHaveValue('')
  })

  it('supports selecting an option with the keyboard', async () => {
    const onChange = vi.fn()
    await render(<TestField onChange={onChange} />)
    await page.getByRole('combobox', { name: 'Country' }).click()
    await userEvent.keyboard('{ArrowDown}')
    await expect.element(page.getByRole('option', { name: 'France' })).toHaveAttribute('data-highlighted', '')
    await userEvent.keyboard('{Enter}')

    expect(onChange).toHaveBeenCalledWith({ target: { name: 'country', value: 'FR' } })
    await expect.element(page.getByRole('combobox', { name: 'Country' })).toHaveValue('France')
  })

  it('displays the saved label without fetching an item already in the options', async () => {
    await render(<TestField initialValue="FR" />)

    await expect.element(page.getByRole('combobox', { name: 'Country' })).toHaveValue('France')
    expect(get.mock.calls.map(([path]) => path)).toEqual([`${configPath}?`, `${itemsPath}?`])
  })

  it('fetches and displays a saved value missing from the options, including the initial locale', async () => {
    useQueryParams.mockReturnValue([{ query: { plugins: { i18n: { locale: 'fr' } } } }])
    await render(<TestField initialValue="ES" />)

    await expect.element(page.getByRole('combobox', { name: 'Country' })).toHaveValue('Spain')
    expect(get.mock.calls.map(([path]) => path)).toEqual([
      `${configPath}?locale=fr`,
      `${itemsPath}?locale=fr`,
      `${itemPath}?value=ES&locale=fr`,
    ])
    await page.getByRole('combobox', { name: 'Country' }).click()
    await expect.element(page.getByRole('option', { name: 'Spain' })).toBeVisible()
  })

  it('sends debounced search text and the initial locale to the items endpoint', async () => {
    searchable = true
    useQueryParams.mockReturnValue([{ query: { plugins: { i18n: { locale: 'fr' } } } }])
    await render(<TestField />)
    await page.getByRole('combobox', { name: 'Country' }).click()
    await page.getByRole('combobox', { name: 'Country' }).fill('Ger')

    expect(get).not.toHaveBeenCalledWith(`${itemsPath}?locale=fr&query=Ger`)
    await expect.poll(() => get.mock.calls.map(([path]) => path)).toEqual([
      `${configPath}?locale=fr`,
      `${itemsPath}?locale=fr`,
      `${itemsPath}?locale=fr&query=Ger`,
    ])
    await expect.element(page.getByRole('option', { name: 'Germany' })).toBeVisible()
    await expect.element(page.getByRole('option', { name: 'France' })).not.toBeInTheDocument()
  })

  it('filters non-searchable options locally without fetching again', async () => {
    await render(<TestField />)
    await page.getByRole('combobox', { name: 'Country' }).click()
    await page.getByRole('combobox', { name: 'Country' }).fill('Ger')
    await expect.element(page.getByRole('option', { name: 'Germany' })).toBeVisible()
    await expect.element(page.getByRole('option', { name: 'France' })).not.toBeInTheDocument()

    // Observe requests through the component's 600ms debounce window.
    const start = performance.now()
    await expect.poll(() => {
      expect(get).toHaveBeenCalledTimes(2)
      return performance.now() - start
    }).toBeGreaterThanOrEqual(600)
  })

  it('shows an empty-results message when there are no options', async () => {
    items = []
    await render(<TestField />)
    await page.getByRole('combobox', { name: 'Country' }).click()

    await expect.element(page.getByText('No results found')).toBeVisible()
    await expect.element(page.getByRole('option')).not.toBeInTheDocument()
  })

  it('fetches only the saved item for a disabled field and prevents changes', async () => {
    const onChange = vi.fn()
    useQueryParams.mockReturnValue([{ query: { plugins: { i18n: { locale: 'fr' } } } }])
    await render(<TestField initialValue="ES" disabled onChange={onChange} />)

    await expect.element(page.getByRole('combobox', { name: 'Country' })).toBeDisabled()
    await expect.element(page.getByRole('combobox', { name: 'Country' })).toHaveValue('Spain')
    expect(get.mock.calls.map(([path]) => path)).toEqual([
      `${configPath}?locale=fr`,
      `${itemPath}?value=ES&locale=fr`,
    ])
    await expect.element(page.getByRole('button', { name: 'Clear' })).not.toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('settles an empty disabled field without requesting any items', async () => {
    await render(<TestField disabled />)

    await expect.element(page.getByRole('combobox', { name: 'Country' })).toBeDisabled()
    await expect.element(page.getByRole('combobox', { name: 'Country' })).toHaveValue('')
    await expect.element(page.getByRole('alert').filter({ hasText: 'Loading' })).not.toBeInTheDocument()
    expect(get.mock.calls.map(([path]) => path)).toEqual([`${configPath}?`])
  })

  it('associates its validation message with the labelled field instead of the hint', async () => {
    await render(<TestField error="Country is required" />)

    const input = page.getByRole('combobox', { name: 'Country' })
    await expect.element(input).toBeVisible()
    await expect.element(input).toHaveAttribute('aria-invalid', 'true')
    await expect.element(input).toHaveAccessibleDescription('Country is required')
    await expect.element(page.getByText('Choose a country')).not.toBeInTheDocument()
    await expect.element(page.getByText('Country is required')).toBeVisible()
  })
})
