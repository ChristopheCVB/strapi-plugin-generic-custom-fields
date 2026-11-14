import { useState } from 'react'
import { DesignSystemProvider } from '@strapi/design-system'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import Input from '../../../admin/src/components/Input'
import { PLUGIN_ID } from '../../../admin/src/pluginId'
import type { ItemResponse } from '../../../server/src/config'

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

  it('finds a separately fetched saved item in local search', async () => {
    const onChange = vi.fn()
    await render(<TestField initialValue="ES" onChange={onChange} />)
    const input = page.getByRole('combobox', { name: 'Country' })
    await expect.element(input).toHaveValue('Spain')
    await input.click()
    await input.fill('Spa')
    await expect.element(page.getByRole('option', { name: 'Spain' })).toBeVisible()
    await expect.element(page.getByRole('option', { name: 'France' })).not.toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await expect.element(input).toHaveValue('Spain')
    expect(onChange).not.toHaveBeenCalled()
  })

  it.each([false, true])('refreshes a separately fetched saved label when locale changes (disabled: %s)', async (disabled) => {
    const originalGet = get.getMockImplementation()!
    get.mockImplementation((path: string) => path.includes(`${itemPath}?`)
      ? Promise.resolve({ data: { value: 'ES', label: path.includes('locale=fr') ? 'Espagne' : 'Spain' } })
      : originalGet(path))
    const onChange = vi.fn()
    const screen = await render(<TestField initialValue="ES" disabled={disabled} onChange={onChange} />)
    const input = page.getByRole('combobox', { name: 'Country' })
    await expect.element(input).toHaveValue('Spain')
    useQueryParams.mockReturnValue([{ query: { plugins: { i18n: { locale: 'fr' } } } }])
    await screen.rerender(<TestField initialValue="ES" disabled={disabled} onChange={onChange} />)
    await expect.element(input).toHaveValue('Espagne')
    expect(get).toHaveBeenCalledWith(`${itemPath}?value=ES&locale=fr`)
    expect(onChange).not.toHaveBeenCalled()
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

  it.each([false, true])('browses alternatives to saved and newly selected values (searchable: %s)', async (serverSearch) => {
    searchable = serverSearch
    const onChange = vi.fn()
    await render(<TestField initialValue="FR" onChange={onChange} />)
    const input = page.getByRole('combobox', { name: 'Country' })
    await expect.element(input).toHaveValue('France')
    await input.click()
    await expect.element(page.getByRole('option', { name: 'Germany' })).toBeVisible()
    expect(onChange).not.toHaveBeenCalled()
    await page.getByRole('option', { name: 'Germany' }).click()
    await expect.element(input).toHaveValue('Germany')
    await userEvent.keyboard('{ArrowDown}')
    await expect.element(page.getByRole('option', { name: 'France' })).toBeVisible()
    await userEvent.keyboard('{Enter}')
    await expect.element(input).toHaveValue('France')
    expect(onChange).toHaveBeenLastCalledWith({ target: { name: 'country', value: 'FR' } })
  })

  it.each([false, true])('cancels searches and preserves the saved label and icon (searchable: %s)', async (serverSearch) => {
    searchable = serverSearch
    items[0].icon = { src: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg"/>')}`, colorMask: true }
    const onChange = vi.fn()
    const screen = await render(<TestField initialValue="FR" onChange={onChange} />)
    const input = page.getByRole('combobox', { name: 'Country' })
    await expect.element(input).toHaveValue('France')
    const icon = screen.container.querySelector('span[style*="data:image"]')
    expect(icon).not.toBeNull()

    for (const dismiss of ['escape', 'outside', 'blur']) {
      await input.click()
      await input.fill('Ger')
      await expect.element(page.getByRole('option', { name: 'Germany' })).toBeVisible()
      await expect.element(page.getByRole('option', { name: 'France' })).not.toBeInTheDocument()
      expect(icon?.isConnected).toBe(true)
      if (dismiss === 'escape') await userEvent.keyboard('{Escape}')
      else if (dismiss === 'outside') await page.getByText('Country', { exact: true }).click()
      else input.element().blur()
      await expect.element(input).toHaveValue('France')
      await input.click()
      await expect.element(page.getByRole('option', { name: 'France' })).toBeVisible()
      await expect.element(page.getByRole('option', { name: 'Germany' })).toBeVisible()
      await userEvent.keyboard('{Escape}')
    }
    expect(onChange).not.toHaveBeenCalled()
  })

  it.each([false, true])('keeps a saved value through empty searches and empty results (searchable: %s)', async (serverSearch) => {
    searchable = serverSearch
    const onChange = vi.fn()
    await render(<TestField initialValue="FR" onChange={onChange} />)
    const input = page.getByRole('combobox', { name: 'Country' })
    await expect.element(input).toHaveValue('France')
    await input.click()
    await userEvent.keyboard('{End}G')
    await expect.element(input).toHaveValue('FranceG')
    await input.fill('no match')
    await expect.element(page.getByText('No results found')).toBeVisible()
    await expect.element(page.getByRole('option')).not.toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await expect.element(input).toHaveValue('France')
    await input.click()
    await input.fill('')
    await expect.element(page.getByRole('option', { name: 'Germany' })).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await expect.element(input).toHaveValue('France')
    // Escape on an already closed field must not invoke the primitive's clear behavior.
    await userEvent.keyboard('{Escape}')
    expect(onChange).not.toHaveBeenCalled()
    await page.getByRole('button', { name: 'Clear' }).click()
    expect(onChange).toHaveBeenLastCalledWith({ target: { name: 'country', value: '' } })
  })

  it('uses server results without applying a second label filter', async () => {
    searchable = true
    const originalGet = get.getMockImplementation()!
    get.mockImplementation((path: string) => path.includes('query=alias')
      ? Promise.resolve({ data: { items: [items[1]] } })
      : originalGet(path))
    await render(<TestField initialValue="FR" />)
    const input = page.getByRole('combobox', { name: 'Country' })
    await input.click()
    await input.fill('alias')
    await expect.element(page.getByRole('option', { name: 'France' })).not.toBeInTheDocument()
    await expect.element(page.getByRole('option', { name: 'Germany' })).toBeVisible()
    await page.getByRole('option', { name: 'Germany' }).click()
    await expect.element(input).toHaveValue('Germany')
  })

  it('ignores late responses after a new search and after cancellation', async () => {
    searchable = true
    const oldSearch = Promise.withResolvers<{ data: { items: ItemResponse[] } }>()
    const cancelledSearch = Promise.withResolvers<{ data: { items: ItemResponse[] } }>()
    const originalGet = get.getMockImplementation()!
    get.mockImplementation((path: string) => {
      if (path.includes('query=old')) return oldSearch.promise
      if (path.includes('query=cancel')) return cancelledSearch.promise
      return originalGet(path)
    })
    await render(<TestField initialValue="FR" />)
    const input = page.getByRole('combobox', { name: 'Country' })
    await input.click()
    await input.fill('old')
    await expect.poll(() => get.mock.calls.some(([path]) => path.includes('query=old'))).toBe(true)
    await input.fill('Ger')
    await expect.poll(() => get.mock.calls.some(([path]) => path.includes('query=Ger'))).toBe(true)
    await expect.element(page.getByRole('option', { name: 'France' })).not.toBeInTheDocument()
    oldSearch.resolve({ data: { items: [] } })
    await userEvent.keyboard('{ArrowDown}')
    await expect.element(page.getByRole('option', { name: 'Germany' })).toBeVisible()
    await input.fill('cancel')
    await expect.poll(() => get.mock.calls.some(([path]) => path.includes('query=cancel'))).toBe(true)
    await userEvent.keyboard('{Escape}')
    await expect.element(input).toHaveValue('France')
    await input.click()
    await expect.element(page.getByRole('option', { name: 'France' })).toBeVisible()
    cancelledSearch.resolve({ data: { items: [] } })
    await userEvent.keyboard('{ArrowDown}')
    await expect.element(page.getByRole('option', { name: 'Germany' })).toBeVisible()
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
