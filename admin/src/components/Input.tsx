import type { ItemsResponse, ItemResponse, Config } from '../../../server/src/config'
import { type InputProps, useField, useFetchClient, useQueryParams } from '@strapi/strapi/admin'

import { ChangeEvent, forwardRef, useCallback, useEffect, useState } from 'react'
import { DesignSystemProvider, Combobox, ComboboxOption, Field } from '@strapi/design-system'
import { useDebounce } from '@uidotdev/usehooks'
import { styled, useTheme } from 'styled-components'

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

const Input = forwardRef<HTMLInputElement, InputProps>((props, forwardedRef) => {
  const theme = useTheme()

  const { get } = useFetchClient()

  // @ts-expect-error props.attribute.customField is a string
  const customFieldUID = props.attribute.customField as string
  
  const field = useField<string>(props.name)
  
  // @ts-expect-error query.plugins is an object
  const locale = useQueryParams()[0].query.plugins?.i18n?.locale as string | undefined

  const [loading, setLoading] = useState<boolean>(true)
  // const [page, setPage] = useState<number>(1)
  // const [totalItems, setTotalItems] = useState<number | undefined>(undefined)
  const [items, setItems] = useState<ItemsResponse['items'] | undefined>(undefined)
  const [filter, setFilter] = useState<string>('')
  const debouncedFilter = useDebounce(filter, 600)

  const [customFieldConfig, setCustomFieldConfig] = useState<PickSerializable<Config['customFields'][number]> | undefined>(undefined)
  const [selectedItem, setSelectedItem] = useState<ItemResponse | undefined>(undefined)

  const loadFieldConfig = useCallback(async (localCustomFieldUID: string) => {
    const response = await get<PickSerializable<Config['customFields'][number]>>(
      `/${PLUGIN_ID}/config/custom-fields/${localCustomFieldUID}?locale=${locale}`,
    )
    setCustomFieldConfig(response.data)
  }, [])

  const loadItems = useCallback(async () => {
    if (!customFieldConfig) {
      return
    }

    setLoading(true)

    if (!items || customFieldConfig.searchable/* || customFieldConfig!.paginateItems && items.length < totalItems!*/) {
      if (!props.disabled) {
        const searchParams = new URLSearchParams()
        if (locale) {
          searchParams.set('locale', locale)
        }
        if (customFieldConfig.searchable && debouncedFilter) {
          searchParams.set('query', debouncedFilter)
          // searchParams.set('page', '1')
        }/* else if (customFieldConfig.paginateItems) {
            searchParams.set('page', page.toString())
          }*/
        const response = await get<ItemsResponse>(
          `/${PLUGIN_ID}/custom-fields/${customFieldUID}/items?${searchParams.toString()}`,
        )
        if (field.value && !response.data.items.find(item => item.value === field.value)) {
          const responseItem = await get<ItemResponse>(
            `/${PLUGIN_ID}/custom-fields/${customFieldUID}/item?value=${encodeURIComponent(field.value)}&locale=${locale}`,
          )
          response.data.items.push(responseItem.data)
        }
        setItems(response.data.items)
        // if (customFieldConfig.searchable && debouncedFilter) {
        //   setTotalItems(response.data.items.length)
        //   setItems(response.data.items)
        // } else {
        //   setTotalItems(response.data.total)
        //   if (customFieldConfig.paginateItems && page > 1) {
        //     setItems(prevItems => [...(prevItems ?? []), ...response.data.items])
        //   }
        //   else {
        //     setItems(response.data.items)
        //   }
        // }
      } else if (field.value) {
        const response = await get<ItemResponse>(
          `/${PLUGIN_ID}/custom-fields/${customFieldUID}/item?value=${encodeURIComponent(field.value)}&locale=${locale}`,
        )
        setItems([response.data])
      }
    }

    setLoading(false)
  }, [
    props.disabled,
    customFieldConfig,
    debouncedFilter,
    locale,
  ])

  useEffect(() => {
    loadFieldConfig(customFieldUID).catch((error) => {
      // eslint-disable-next-line no-console
      console.error(`Error fetching custom field config for CustomField[${customFieldUID}]:`, error)
    })
  }, [
    loadFieldConfig,
    customFieldUID,
  ])

  useEffect(() => {
    if (!customFieldConfig) {
      return
    }
    loadItems().catch((error) => {
      // eslint-disable-next-line no-console
      console.error(`Error fetching items for CustomField[${customFieldUID}]:`, error)
    })
  }, [
    loadItems,
    customFieldConfig,
  ])

  useEffect(() => {
    if (field.value) {
      setSelectedItem(items?.find(item => item.value === field.value))
    } else {
      setSelectedItem(undefined)
    }
  }, [field.value, items])

  return (
    <DesignSystemProvider theme={theme}>
      <Field.Root disabled={props.disabled} required={props.required} hint={props.hint} name={props.name} id={props.name} error={field.error} >
        <Field.Label action={props.labelAction}>{props.label}</Field.Label>
        <Combobox
          ref={forwardedRef}
          onChange={(value: string) => field.onChange(props.name, value ?? '')}
          defaultTextValue={field.value}
          value={field.value}
          placeholder={props.placeholder}
          disabled={props.disabled}
          loading={loading}
          autocomplete={{ type: 'list', filter: 'contains' }}
          onInputChange={(ev: ChangeEvent<HTMLInputElement>) => setFilter(ev.target.value)}
          filterValue={customFieldConfig?.searchable ? '' : undefined}
          // hasMoreItems={totalItems && totalItems > (items?.length ?? 0)}
          // onLoadMore={() => setPage(prevPage => prevPage + 1)}
          startIcon={
            selectedItem?.icon ? <Icon src={selectedItem.icon.src} colorMask={selectedItem.icon.colorMask} /> : null
          }
          onClear={props.disabled ? undefined : () => field.onChange(props.name, '')}
        >
          {
            items?.map(item => {
              return (
                <ComboboxOption
                  key={item.value}
                  value={item.value}
                >
                  {
                    item.icon ? <Icon src={item.icon.src} colorMask={item.icon.colorMask} /> : null
                  }
                  {item.label}
                </ComboboxOption>
              )
            })
          }
        </Combobox>
        <Field.Hint />
        <Field.Error />
      </Field.Root>
    </DesignSystemProvider>
  )
})

export default Input
