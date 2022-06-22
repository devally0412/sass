import * as React from 'react'

import { render, testStories } from '@saas-ui/test-utils'
import * as stories from '../stories/array-field.stories'

const { ArrayFieldRef, ...rest } = stories

const { AutoArrayField, AutoYupArrayField, MinMaxNoSchema } =
  testStories<typeof stories>(rest)

test('should add rows', async () => {
  const { getByLabelText, getAllByLabelText, user } = render(<AutoArrayField />)

  const add = getByLabelText('Add row')

  await user.click(add)

  const fields = getAllByLabelText('Title')

  expect(fields).toHaveLength(2)
})

test('should not add or remove more rows than min/max.', async () => {
  const { getByLabelText, getAllByLabelText, user } = render(<MinMaxNoSchema />)

  const remove = getByLabelText('Remove row')
  const add = getByLabelText('Add row')

  await user.click(remove)

  expect(getAllByLabelText('Title')).toHaveLength(1)

  await user.click(add)
  await user.click(add)
  await user.click(add)

  expect(getAllByLabelText('Title')).toHaveLength(3)
})

// test('should validate with schema', async () => {
//   const onSubmit = jest.fn()
//   const { getByText, getAllByText, user } = render(
//     <WithYupSchema onSubmit={onSubmit} />
//   )

//   const submit = getByText('Submit')

//   await user.click(submit)

//   expect(onSubmit).not.toBeCalled()

//   expect(getAllByText('Too short')).toHaveLength(2)
// })
