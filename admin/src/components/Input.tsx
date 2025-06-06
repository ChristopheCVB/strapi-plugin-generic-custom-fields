import { type InputProps, useField, useFetchClient } from '@strapi/strapi/admin'
import type { Config } from '../../../server/src/config/index'

import { ChangeEvent, useEffect, useState } from 'react'
import { Combobox, ComboboxOption, Field } from '@strapi/design-system'
import { useDebounce } from '@uidotdev/usehooks'

export const Input = (props: InputProps) => {
  const { get } = useFetchClient()

  // @ts-expect-error props.attribute.customField is a string
  const customFieldUID = props.attribute.customField

  const field = useField<string>(props.name)

  const [loading, setLoading] = useState<boolean>(true)
  const [items, setItems] = useState<Awaited<ReturnType<Config['customFields'][number]['fetchItems']>> | undefined>(undefined)
  const [filter, setFilter] = useState<string>('')
  const debouncedFilter = useDebounce(filter, 1200)

  useEffect(() => {
    const fetchFromAdmin = async () => {
      if (!props.disabled) {
        try {
          setLoading(true)
          const response = await get(
            `/generic-custom-fields/${customFieldUID}/values?query=${encodeURIComponent(debouncedFilter)}`,
          )
          setItems(response.data)
        } catch (error) {
        // eslint-disable-next-line no-console
          console.error(`Error fetching CustomField[${customFieldUID}] values:`, error)
        } finally {
          setLoading(false)
        }
      } else if (field.value) {
        try {
          setLoading(true)
          const response = await get(
            `/generic-custom-fields/${customFieldUID}/value?id=${encodeURIComponent(field.value)}`,
          )
          setItems([response.data])
        } catch (error) {
        // eslint-disable-next-line no-console
          console.error(`Error fetching CustomField[${customFieldUID}] value:`, error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchFromAdmin()
  }, [
    props.disabled,
    customFieldUID,
    debouncedFilter,
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
        autocomplete={'none'}
        onInputChange={(ev: ChangeEvent<HTMLInputElement>) => setFilter(ev.target.value)}
        filterValue=''
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
