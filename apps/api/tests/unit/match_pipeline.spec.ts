import { test } from '@japa/runner'
import { FinanceService } from '../../app/finances/finance_service.js'

test.group('Match Pipeline — Ticket Revenue', () => {
  test('top 5 position gets rank bonus', ({ assert }) => {
    // Division 1, position 3 → base 15M + bonus 5M = ~20M (±10%)
    const revenue = FinanceService.calculateTicketRevenue(1, 3)
    assert.isAbove(revenue, 17_000_000) // 20M - 10% ≈ 18M, with margin
    assert.isBelow(revenue, 23_000_000) // 20M + 10% ≈ 22M, with margin
  })

  test('position outside top 5 gets no rank bonus', ({ assert }) => {
    // Division 1, position 10 → base 15M only = ~15M (±10%)
    const revenue = FinanceService.calculateTicketRevenue(1, 10)
    assert.isAbove(revenue, 12_000_000)
    assert.isBelow(revenue, 18_000_000)
  })

  test('top 5 earns more than outside top 5 on average', ({ assert }) => {
    // Run multiple times to account for random variation
    let top5Total = 0
    let outsideTotal = 0
    const iterations = 100

    for (let i = 0; i < iterations; i++) {
      top5Total += FinanceService.calculateTicketRevenue(1, 1)
      outsideTotal += FinanceService.calculateTicketRevenue(1, 15)
    }

    const top5Avg = top5Total / iterations
    const outsideAvg = outsideTotal / iterations

    // Top 5 should earn ~5M more on average (the rank bonus)
    assert.isAbove(top5Avg - outsideAvg, 3_000_000)
  })

  test('division level affects base revenue', ({ assert }) => {
    // Division 1 base = 15M, Division 3 base = 7M, both at position 10 (no bonus)
    let div1Total = 0
    let div3Total = 0
    const iterations = 100

    for (let i = 0; i < iterations; i++) {
      div1Total += FinanceService.calculateTicketRevenue(1, 10)
      div3Total += FinanceService.calculateTicketRevenue(3, 10)
    }

    assert.isAbove(div1Total / iterations, div3Total / iterations)
  })
})
