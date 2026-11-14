import type { ItemsResponse, ItemResponse, Config } from '../../../server/src/config'
import { type InputProps, useFetchClient, useQueryParams } from '@strapi/strapi/admin'

import { forwardRef, useEffect, useState } from 'react'
import { Combobox, ComboboxOption, Field, TextInput, Loader } from '@strapi/design-system'
import { useDebounce } from '@uidotdev/usehooks'
import { styled } from 'styled-components'

import { PLUGIN_ID } from '../pluginId'

interface IconProps {
  src: string
  colorMask?: boolean
}

const Icon = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'src' && prop !== 'colorMask',
}).attrs<IconProps>(props => {
  if (props.colorMask) {
    return {
      style: {
        maskImage: `url(${props.src})`,
        maskRepeat: 'no-repeat',
        maskSize: '100% 100%',
        WebkitMaskImage: `url(${props.src})`,
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskSize: '100% 100%',
      },
    }
  } else {
    return {
      style: {
        backgroundImage: `url(${props.src})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'contain',
        backgroundPosition: 'center',
      },
    }
  }
})<IconProps>`
  width: 2em;
  height: 2em;
  display: inline-block;
  margin-right: 0.75em;
  vertical-align: middle;
  background-color: currentColor;
`

const FieldInput = forwardRef<HTMLInputElement, InputProps & { locale?: string }>((props, forwardedRef) => {
  const { get } = useFetchClient()

  // @ts-expect-error props is not fully typed
  const { value, onChange, error, attribute: { customField: customFieldUID } } = props as {
    attribute: {
      customField: string
    }
    value?: string | null
    error?: string | null
    onChange: (event: { target: { name: string, value: string } }) => void
  }

  const { locale } = props
  
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ItemsResponse['items']>()
  const [searchText, setSearchText] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [customFieldConfig, setCustomFieldConfig] = useState<Pick<Config['customFields'][number], 'searchable'>>()
  const [selectedItem, setSelectedItem] = useState<ItemResponse>()
  const filter = searchText ?? ''
  const query = customFieldConfig?.searchable ? filter : ''
  const debouncedQuery = useDebounce(query, 600)
  const requestQuery = query && query !== debouncedQuery ? null : query
  const selected = items?.find(item => item.value === value)
    ?? (selectedItem?.value === value ? selectedItem : undefined)
  const options = !query && selected && !items?.some(item => item.value === value)
    ? [selected, ...(items ?? [])]
    : items ?? []

  useEffect(() => {
    let active = true
    const searchParams = new URLSearchParams()
    if (locale) searchParams.set('locale', locale)
    get<Pick<Config['customFields'][number], 'searchable'>>(
      `/${PLUGIN_ID}/config/custom-fields/${customFieldUID}?${searchParams.toString()}`,
    ).then(response => {
      if (active) setCustomFieldConfig(response.data)
    }).catch((error) => {
      // eslint-disable-next-line no-console
      console.error(`Error fetching custom field config for CustomField[${customFieldUID}]:`, error)
    })
    return () => { active = false }
  }, [get, customFieldUID, locale])

  useEffect(() => {
    if (!customFieldConfig) return
    if (props.disabled) {
      setItems([])
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    // Invalidate the previous request as soon as typing changes, before the debounce expires.
    if (requestQuery === null) return
    const searchParams = new URLSearchParams()
    if (locale) searchParams.set('locale', locale)
    if (requestQuery) searchParams.set('query', requestQuery)
    get<ItemsResponse>(
      `/${PLUGIN_ID}/custom-fields/${customFieldUID}/items?${searchParams.toString()}`,
    ).then(response => {
      if (active) setItems(response.data.items)
    }).catch((error) => {
      // eslint-disable-next-line no-console
      console.error(`Error fetching items for CustomField[${customFieldUID}]:`, error)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [get, customFieldConfig, customFieldUID, props.disabled, requestQuery, locale])

  useEffect(() => {
    if (!value || !items) return
    const item = items.find(item => item.value === value)
    if (item) {
      setSelectedItem(item)
      return
    }
    if (selectedItem?.value === value) return

    let active = true
    const searchParams = new URLSearchParams({ value })
    if (locale) searchParams.set('locale', locale)
    get<ItemResponse>(
      `/${PLUGIN_ID}/custom-fields/${customFieldUID}/item?${searchParams.toString()}`,
    ).then(response => {
      if (active) setSelectedItem(response.data)
    }).catch((error) => {
      // eslint-disable-next-line no-console
      console.error(`Error fetching item for CustomField[${customFieldUID}]:`, error)
    })
    return () => { active = false }
  }, [get, customFieldUID, value, items, selectedItem, locale])

  return (
    <Field.Root required={props.required} hint={props.hint} name={props.name} id={props.name} error={error ?? undefined} >
      <Field.Label action={props.labelAction}>{props.label}</Field.Label>
      { items ?
        (<Combobox
          key={`${props.name}-combobox`}
          ref={forwardedRef}
          onChange={(newValue) => {
            if (!newValue || newValue === value) return
            setSelectedItem(items.find(item => item.value === newValue))
            setSearchText(null)
            onChange({ target: { name: props.name, value: newValue } })
          }}
          textValue={searchText ?? selected?.label ?? value ?? ''}
          open={open}
          onOpenChange={(nextOpen) => {
            setOpen(nextOpen)
            if (!nextOpen) setSearchText(null)
          }}
          onBlur={(event) => {
            // The primitive otherwise commits matching text or clears a missing selection on blur.
            event.preventDefault()
            if (event.relatedTarget instanceof HTMLElement && event.relatedTarget.closest('[role="option"]')) return
            setOpen(false)
            setSearchText(null)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              setOpen(false)
              setSearchText(null)
            }
          }}
          value={value ?? ''}
          placeholder={props.placeholder}
          disabled={props.disabled}
          loading={loading}
          autocomplete={!customFieldConfig?.searchable && filter ? { type: 'list', filter: 'contains' } : 'none'}
          onInputChange={event => setSearchText(event.target.value)}
          startIcon={
            selected?.icon ?
              <Icon src={selected.icon.src} colorMask={selected.icon.colorMask} />
              : null
          }
          onClear={
            props.disabled ?
              undefined :
              () => {
                setSearchText(null)
                onChange({ target: { name: props.name, value: '' } })
              }
          }
        >
          {
            options.map(item => {
              return (
                <ComboboxOption
                  key={item.value}
                  value={item.value}
                >
                  { item.icon ? <Icon src={item.icon.src} colorMask={item.icon.colorMask} /> : null }
                  { item.label }
                </ComboboxOption>
              )
            })
          }
        </Combobox>)
        : (<TextInput disabled value={value ?? ''} startAction={<Loader small />} key={`${props.name}-input`} />)
      }
      <Field.Hint />
      <Field.Error />
    </Field.Root>
  )
})

const Input = forwardRef<HTMLInputElement, InputProps>((props, forwardedRef) => {
  // @ts-expect-error query.plugins is an object
  const locale = useQueryParams()[0].query.plugins?.i18n?.locale as string | undefined
  const { attribute } = props as InputProps & { attribute: { customField: string } }

  // Options and pending requests belong to one field and locale.
  return <FieldInput {...props} locale={locale} ref={forwardedRef} key={JSON.stringify([attribute.customField, locale])} />
})

export default Input
