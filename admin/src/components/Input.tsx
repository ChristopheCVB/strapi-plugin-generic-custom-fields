import type { ItemsResponse, ItemResponse, Config } from '../../../server/src/config'
import { type InputProps, useField, useFetchClient } from '@strapi/strapi/admin'

import { ChangeEvent, useEffect, useState } from 'react'
import { Combobox, ComboboxOption, Field } from '@strapi/design-system'
import { useDebounce } from '@uidotdev/usehooks'

export const Input = (props: InputProps) => {
  const { get } = useFetchClient()

  // @ts-expect-error props.attribute.customField is a string
  const customFieldUID = props.attribute.customField

  const field = useField<string>(props.name)

  const [loading, setLoading] = useState<boolean>(true)
  // const [page, setPage] = useState<number>(1)
  // const [totalItems, setTotalItems] = useState<number | undefined>(undefined)
  const [items, setItems] = useState<ItemsResponse['items'] | undefined>(undefined)
  const [filter, setFilter] = useState<string>('')
  const debouncedFilter = useDebounce(filter, 600)

  const [customFieldConfig, setCustomFieldConfig] = useState<PickSerializable<Config['customFields'][number]> | undefined>(undefined)

  useEffect(() => {
    const fetchFromAdmin = async () => {
      setLoading(true)

      let localCustomFieldConfig = customFieldConfig
      if (!customFieldConfig) {
        const response = await get<PickSerializable<Config['customFields'][number]>>(
          `/generic-custom-fields/config/custom-fields/${customFieldUID}`,
        )
        setCustomFieldConfig(response.data)
        localCustomFieldConfig = response.data
      }

      if (!items || localCustomFieldConfig!.searchable/* || localCustomFieldConfig!.paginateItems && items.length < totalItems!*/) {
        if (!props.disabled) {
          const searchParams = new URLSearchParams()
          if (localCustomFieldConfig?.searchable && debouncedFilter) {
            searchParams.set('query', debouncedFilter)
            // searchParams.set('page', '1')
          }/* else if (localCustomFieldConfig?.paginateItems) {
            searchParams.set('page', page.toString())
          }*/
          const response = await get<ItemsResponse>(
            `/generic-custom-fields/custom-fields/${customFieldUID}/items?${searchParams.toString()}`,
          )
          setItems(response.data.items)
          // if (localCustomFieldConfig?.searchable && debouncedFilter) {
          //   setTotalItems(response.data.items.length)
          //   setItems(response.data.items)
          // } else {
          //   setTotalItems(response.data.total)
          //   if (localCustomFieldConfig?.paginateItems && page > 1) {
          //     setItems(prevItems => [...(prevItems ?? []), ...response.data.items])
          //   }
          //   else {
          //     setItems(response.data.items)
          //   }
          // }
        } else if (field.value) {
          const response = await get<ItemResponse>(
            `/generic-custom-fields/custom-fields/${customFieldUID}/item?value=${encodeURIComponent(field.value)}`,
          )
          setItems([response.data])
        }
      }

      setLoading(false)
    }

    fetchFromAdmin().catch((error) => {
      // eslint-disable-next-line no-console
      console.error(`Error fetching items for CustomField[${customFieldUID}]:`, error)
    })
  }, [
    props.disabled,
    customFieldUID,
    debouncedFilter,
    // page,
  ])

  return (
    <Field.Root disabled={props.disabled} required={props.required} hint={props.hint} name={props.name} id={props.name} error={field.error} >
      <Field.Label>{props.label}</Field.Label>
      <Combobox
        onChange={(value: string) => field.onChange(props.name, value ?? '')}
        value={field.value}
        placeholder={props.placeholder}
        disabled={props.disabled}
        loading={loading}
        autocomplete={{ type: 'list', filter: 'contains' }}
        onInputChange={(ev: ChangeEvent<HTMLInputElement>) => setFilter(ev.target.value)}
        filterValue={customFieldConfig?.searchable ? '' : undefined}
        // hasMoreItems={totalItems && totalItems > (items?.length ?? 0)}
        // onLoadMore={() => setPage(prevPage => prevPage + 1)}
      >
        {
          items?.map(item => {
            return (
              <ComboboxOption
                key={item.value}
                value={item.value}
              >
                {item.label}
              </ComboboxOption>
            )
          })
        }
      </Combobox>
      <Field.Hint />
      <Field.Error />
    </Field.Root>
  )
}
