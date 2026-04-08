import { test } from '@japa/runner'
import { buildMarketFilters, buildMarketSort } from '../../app/transfers/market_controller.js'

test.group('Market filters — buildMarketFilters', () => {
  test('sans filtre retourne uniquement la condition status=active', ({ assert }) => {
    const conditions = buildMarketFilters({})
    assert.lengthOf(conditions, 1)
  })

  test('filtre source ajoute une condition', ({ assert }) => {
    const conditions = buildMarketFilters({ source: 'ai_market' })
    assert.lengthOf(conditions, 2)
  })

  test('filtre position ajoute une condition', ({ assert }) => {
    const conditions = buildMarketFilters({ position: 'GK' })
    assert.lengthOf(conditions, 2)
  })

  test('filtre overallMin ajoute une condition', ({ assert }) => {
    const conditions = buildMarketFilters({ overallMin: 70 })
    assert.lengthOf(conditions, 2)
  })

  test('filtre overallMax ajoute une condition', ({ assert }) => {
    const conditions = buildMarketFilters({ overallMax: 80 })
    assert.lengthOf(conditions, 2)
  })

  test('filtre ageMin ajoute une condition', ({ assert }) => {
    const conditions = buildMarketFilters({ ageMin: 20 })
    assert.lengthOf(conditions, 2)
  })

  test('filtre ageMax ajoute une condition', ({ assert }) => {
    const conditions = buildMarketFilters({ ageMax: 30 })
    assert.lengthOf(conditions, 2)
  })

  test('filtre priceMin ajoute une condition', ({ assert }) => {
    const conditions = buildMarketFilters({ priceMin: 1_000_000 })
    assert.lengthOf(conditions, 2)
  })

  test('filtre priceMax ajoute une condition', ({ assert }) => {
    const conditions = buildMarketFilters({ priceMax: 5_000_000 })
    assert.lengthOf(conditions, 2)
  })

  test('combinaison de tous les filtres produit 9 conditions', ({ assert }) => {
    const conditions = buildMarketFilters({
      source: 'human_listing',
      position: 'ST',
      overallMin: 60,
      overallMax: 80,
      ageMin: 20,
      ageMax: 30,
      priceMin: 500_000,
      priceMax: 10_000_000,
    })
    // 1 (status=active) + 8 filters = 9
    assert.lengthOf(conditions, 9)
  })

  test('overallMin=0 est appliqué (valeur falsy mais valide)', ({ assert }) => {
    const conditions = buildMarketFilters({ overallMin: 0 })
    assert.lengthOf(conditions, 2)
  })

  test('ageMin=0 est appliqué (valeur falsy mais valide)', ({ assert }) => {
    const conditions = buildMarketFilters({ ageMin: 0 })
    assert.lengthOf(conditions, 2)
  })

  test('priceMin=0 est appliqué (valeur falsy mais valide)', ({ assert }) => {
    const conditions = buildMarketFilters({ priceMin: 0 })
    assert.lengthOf(conditions, 2)
  })

  test('undefined values ne sont pas ajoutées comme filtres', ({ assert }) => {
    const conditions = buildMarketFilters({
      position: undefined,
      overallMin: undefined,
      overallMax: undefined,
      ageMin: undefined,
      ageMax: undefined,
      priceMin: undefined,
      priceMax: undefined,
      source: undefined,
    })
    assert.lengthOf(conditions, 1)
  })
})

test.group('Market sort — buildMarketSort', () => {
  test('défaut = desc createdAt quand pas de sortBy', ({ assert }) => {
    const sort = buildMarketSort({})
    assert.isDefined(sort)
  })

  test('sortBy=overall sortOrder=asc retourne un sort', ({ assert }) => {
    const sort = buildMarketSort({ sortBy: 'overall', sortOrder: 'asc' })
    assert.isDefined(sort)
  })

  test('sortBy=price sortOrder=desc retourne un sort', ({ assert }) => {
    const sort = buildMarketSort({ sortBy: 'price', sortOrder: 'desc' })
    assert.isDefined(sort)
  })

  test('sortBy=age retourne un sort', ({ assert }) => {
    const sort = buildMarketSort({ sortBy: 'age' })
    assert.isDefined(sort)
  })

  test('sortBy=potential retourne un sort', ({ assert }) => {
    const sort = buildMarketSort({ sortBy: 'potential' })
    assert.isDefined(sort)
  })

  test('sortBy=recent retourne un sort', ({ assert }) => {
    const sort = buildMarketSort({ sortBy: 'recent' })
    assert.isDefined(sort)
  })

  test('sortBy invalide fallback sur createdAt', ({ assert }) => {
    const sort = buildMarketSort({ sortBy: 'invalid_column' })
    assert.isDefined(sort)
  })
})
