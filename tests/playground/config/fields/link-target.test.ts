import { describe, expect, it } from 'vitest'
import field from '../../../../playground/config/fields/link-target'

describe('Link Target', () => {
  it('resolves both configured targets and preserves unknown stored values', () => {
    expect(field.name).toBe('Link Target')
    expect(field.fetchItems()).toEqual({ items: [field.fetchItem({ value: '_self' }), field.fetchItem({ value: '_blank' })] })
    expect(field.fetchItem({ value: '_self' }).label).toBe('Same window')
    expect(field.fetchItem({ value: 'removed' })).toEqual({ value: 'removed', label: 'removed' })
  })
})
