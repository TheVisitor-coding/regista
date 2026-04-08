import { test } from '@japa/runner'
import { FinanceService } from '../../app/finances/finance_service.js'
import { ValuationService } from '../../app/transfers/valuation_service.js'
import {
  shotOnTargetChance,
  yellowCardChance,
} from '../../app/match/match_probability.js'

// ==================== BILLETTERIE ====================

test.group('Finances — Billetterie', () => {
  test('revenus billetterie Div1 domicile ≈ 15M ± 10%', ({ assert }) => {
    // Position > 5 → no rank bonus → base 15M ± 10%
    const revenue = FinanceService.calculateTicketRevenue(1, 10)
    assert.isAtLeast(revenue, 13_500_000)
    assert.isAtMost(revenue, 16_500_000)
  })

  test('revenus billetterie Div3 domicile ≈ 7M ± 10%', ({ assert }) => {
    const revenue = FinanceService.calculateTicketRevenue(3, 10)
    assert.isAtLeast(revenue, 6_300_000)
    assert.isAtMost(revenue, 7_700_000)
  })

  test('bonus position top-5 augmente les revenus de 5M', ({ assert }) => {
    // Run multiple iterations to average out random variation
    let top5Total = 0
    let outsideTotal = 0
    const iterations = 200

    for (let i = 0; i < iterations; i++) {
      top5Total += FinanceService.calculateTicketRevenue(1, 3)
      outsideTotal += FinanceService.calculateTicketRevenue(1, 10)
    }

    const top5Avg = top5Total / iterations
    const outsideAvg = outsideTotal / iterations
    const diff = top5Avg - outsideAvg

    // The difference should be close to 5M (the rank bonus)
    assert.isAbove(diff, 4_000_000)
    assert.isBelow(diff, 6_000_000)
  })

  test('revenus extérieur Div1 = 5M, Div2 = 3M, Div3 = 2M', ({ assert }) => {
    assert.equal(FinanceService.calculateAwayRevenue(1), 5_000_000)
    assert.equal(FinanceService.calculateAwayRevenue(2), 3_000_000)
    assert.equal(FinanceService.calculateAwayRevenue(3), 2_000_000)
  })
})

// ==================== PRIMES ====================

test.group('Finances — Primes de match', () => {
  test('victoire = 5M', ({ assert }) => {
    assert.equal(FinanceService.calculateMatchPrime('win'), 5_000_000)
  })

  test('nul = 2M', ({ assert }) => {
    assert.equal(FinanceService.calculateMatchPrime('draw'), 2_000_000)
  })

  test('défaite = 0', ({ assert }) => {
    assert.equal(FinanceService.calculateMatchPrime('loss'), 0)
  })
})

// ==================== VALORISATION JOUEUR ====================

test.group('Finances — Valorisation joueur', () => {
  test('valorisation augmente avec OVR', ({ assert }) => {
    const low = ValuationService.calculateMarketValue(55, 25, 65, 'CM', 20)
    const high = ValuationService.calculateMarketValue(80, 25, 85, 'CM', 20)
    assert.isAbove(high, low)
  })

  test('valorisation diminue avec âge > 30', ({ assert }) => {
    const young = ValuationService.calculateMarketValue(75, 25, 80, 'CM', 20)
    const old = ValuationService.calculateMarketValue(75, 33, 80, 'CM', 20)
    assert.isAbove(young, old)
  })

  test('position ST/CF multiplie la valeur par 1.15', ({ assert }) => {
    const cm = ValuationService.calculateMarketValue(75, 25, 80, 'CM', 20)
    const st = ValuationService.calculateMarketValue(75, 25, 80, 'ST', 20)
    // ST should be 15% more than CM (same stats otherwise)
    const ratio = st / cm
    assert.closeTo(ratio, 1.15, 0.01)
  })

  test('position GK réduit la valeur à 0.85', ({ assert }) => {
    const cm = ValuationService.calculateMarketValue(75, 25, 80, 'CM', 20)
    const gk = ValuationService.calculateMarketValue(75, 25, 80, 'GK', 20)
    const ratio = gk / cm
    assert.closeTo(ratio, 0.85, 0.01)
  })

  test('contrat court réduit la valeur', ({ assert }) => {
    const longContract = ValuationService.calculateMarketValue(75, 25, 80, 'CM', 20)
    const shortContract = ValuationService.calculateMarketValue(75, 25, 80, 'CM', 3)
    assert.isAbove(longContract, shortContract)
    // 3 matches remaining → contractMod = 0.3, vs 20 → contractMod = 1.0
    const ratio = shortContract / longContract
    assert.closeTo(ratio, 0.3, 0.05)
  })
})

// ==================== PROBABILITÉS (compléments) ====================

test.group('Finances — Probabilités complémentaires', () => {
  test('shotOnTargetChance entre 20% et 65%', ({ assert }) => {
    const worst = shotOnTargetChance(0)
    const best = shotOnTargetChance(100)
    assert.closeTo(worst, 0.20, 0.01)
    assert.closeTo(best, 0.50, 0.01)
    // With shooting = 150 (impossible but tests cap)
    const overcap = shotOnTargetChance(150)
    assert.isAtMost(overcap, 0.65)
  })

  test('yellowCardChance toujours 30%', ({ assert }) => {
    assert.equal(yellowCardChance(), 0.30)
  })
})
