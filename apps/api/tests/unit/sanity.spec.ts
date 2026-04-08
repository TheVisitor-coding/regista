import { test } from '@japa/runner'

test.group('Sanity', () => {
  test('2 + 2 = 4', async ({ assert }) => {
    assert.equal(2 + 2, 4)
  })
})
