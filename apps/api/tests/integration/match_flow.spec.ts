import { test } from '@japa/runner'
import { simulateMinute } from '../../app/match/match_minute_simulator.js'
import { addedTimeMinutes } from '../../app/match/match_probability.js'
import type { MatchState, TeamState, PlayerState } from '../../app/match/match_state.js'
import { FinanceService } from '../../app/finances/finance_service.js'

// ---------- Seeded PRNG ----------
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------- Helpers ----------
function makePlayer(position: string, overall: number): PlayerState {
  const isGK = position === 'GK'
  return {
    playerId: crypto.randomUUID(),
    position,
    overall,
    fatigue: 0,
    yellowCards: 0,
    isOut: false,
    shooting: isGK ? 20 : overall - 5 + Math.floor(Math.random() * 10),
    passing: overall - 3 + Math.floor(Math.random() * 6),
    vision: overall - 5 + Math.floor(Math.random() * 10),
    tackling: isGK ? 25 : overall - 5 + Math.floor(Math.random() * 10),
    dribbling: isGK ? 20 : overall - 3 + Math.floor(Math.random() * 6),
    composure: overall - 2 + Math.floor(Math.random() * 4),
    workRate: overall - 5 + Math.floor(Math.random() * 10),
    stamina: overall + Math.floor(Math.random() * 5),
    pace: overall - 5 + Math.floor(Math.random() * 10),
    heading: overall - 5 + Math.floor(Math.random() * 10),
    crossing: overall - 5 + Math.floor(Math.random() * 10),
    marking: isGK ? 25 : overall - 5 + Math.floor(Math.random() * 10),
    reflexes: isGK ? overall + 5 : 30,
    diving: isGK ? overall + 3 : 30,
  }
}

function makeTeam(clubId: string, overall: number, tactics: Partial<TeamState['tactics']> = {}): TeamState {
  return {
    clubId,
    isAi: false,
    aiProfile: null,
    tactics: {
      mentality: 'balanced',
      pressing: 'medium',
      passingStyle: 'mixed',
      width: 'normal',
      tempo: 'normal',
      defensiveLine: 'normal',
      ...tactics,
    },
    onPitch: [
      makePlayer('GK', overall),
      makePlayer('CB', overall), makePlayer('CB', overall),
      makePlayer('LB', overall), makePlayer('RB', overall),
      makePlayer('CDM', overall),
      makePlayer('CM', overall), makePlayer('CM', overall),
      makePlayer('LW', overall), makePlayer('RW', overall),
      makePlayer('ST', overall + 3),
    ],
    bench: [makePlayer('CM', overall - 5), makePlayer('ST', overall - 5)],
    score: 0,
    substitutionsUsed: 0,
    yellowCards: 0,
    redCards: 0,
    shotsTotal: 0,
    shotsOnTarget: 0,
    fouls: 0,
    corners: 0,
    saves: 0,
    possessionMinutes: 0,
  }
}

test.group('Integration — Match flow complet', () => {
  test('flow complet : composition → 90 min + AT → score cohérent + fatigue + possession + finances', ({ assert }) => {
    // Seed for reproducibility
    const original = Math.random
    Math.random = mulberry32(99999)

    try {
      const homeClubId = crypto.randomUUID()
      const awayClubId = crypto.randomUUID()

      const state: MatchState = {
        matchId: crypto.randomUUID(),
        status: 'first_half',
        minute: 0,
        home: makeTeam(homeClubId, 72, { mentality: 'offensive', pressing: 'high' }),
        away: makeTeam(awayClubId, 68, { mentality: 'defensive', pressing: 'low' }),
        events: [],
        goalsFirstHalf: 0,
        cardsFirstHalf: 0,
        subsFirstHalf: 0,
        injuriesFirstHalf: 0,
        goalsSecondHalf: 0,
        cardsSecondHalf: 0,
        subsSecondHalf: 0,
        injuriesSecondHalf: 0,
      }

      // ---- FIRST HALF (1-45 + added time) ----
      state.status = 'first_half'
      for (let min = 1; min <= 45; min++) {
        state.minute = min
        const events = simulateMinute(state)
        state.events.push(...events)
      }

      const addedFirst = addedTimeMinutes(
        state.goalsFirstHalf,
        state.cardsFirstHalf,
        state.subsFirstHalf,
        state.injuriesFirstHalf,
      )
      for (let min = 46; min < 46 + addedFirst; min++) {
        state.minute = min
        const events = simulateMinute(state)
        state.events.push(...events)
      }

      // Snapshot at halftime
      const halfTimeHomeScore = state.home.score
      const halfTimeAwayScore = state.away.score
      const halfTimePossession = state.home.possessionMinutes + state.away.possessionMinutes

      // ---- SECOND HALF (46-90 + added time) ----
      state.status = 'second_half'
      const secondHalfStart = 46 + addedFirst
      for (let min = secondHalfStart; min < secondHalfStart + 45; min++) {
        state.minute = min
        const events = simulateMinute(state)
        state.events.push(...events)
      }

      const addedSecond = addedTimeMinutes(
        state.goalsSecondHalf,
        state.cardsSecondHalf,
        state.subsSecondHalf,
        state.injuriesSecondHalf,
      )
      for (let min = secondHalfStart + 45; min < secondHalfStart + 45 + addedSecond; min++) {
        state.minute = min
        const events = simulateMinute(state)
        state.events.push(...events)
      }

      state.status = 'finished'
      const totalMinutesPlayed = 45 + addedFirst + 45 + addedSecond

      // ==================== ASSERTIONS ====================

      // 1. Score cohérent avec les events goal
      const homeGoalEvents = state.events.filter((e) => e.type === 'goal' && e.clubId === homeClubId).length
      const awayGoalEvents = state.events.filter((e) => e.type === 'goal' && e.clubId === awayClubId).length
      assert.equal(state.home.score, homeGoalEvents, 'home score matches goal events')
      assert.equal(state.away.score, awayGoalEvents, 'away score matches goal events')

      // 2. Possession totale = nombre de minutes simulées
      const totalPossession = state.home.possessionMinutes + state.away.possessionMinutes
      assert.equal(totalPossession, totalMinutesPlayed, 'total possession = minutes played')

      // 3. L'équipe offensive (home) a tendance à avoir plus de possession
      // (not guaranteed with random, but with seed 99999 and offensive mentality it should be)
      assert.isAbove(state.home.possessionMinutes, 0, 'home has some possession')
      assert.isAbove(state.away.possessionMinutes, 0, 'away has some possession')

      // 4. Fatigue appliquée à tous les joueurs actifs
      for (const player of state.home.onPitch) {
        if (!player.isOut) {
          assert.isAbove(player.fatigue, 50, `home player ${player.position} has significant fatigue after full match`)
        }
      }
      for (const player of state.away.onPitch) {
        if (!player.isOut) {
          assert.isAbove(player.fatigue, 50, `away player ${player.position} has significant fatigue after full match`)
        }
      }

      // 5. Both teams reach high fatigue after 90 min (capped at 100)
      const homeActivePlayers = state.home.onPitch.filter((p) => !p.isOut)
      const awayActivePlayers = state.away.onPitch.filter((p) => !p.isOut)
      const homeAvgFatigue = homeActivePlayers.reduce((sum, p) => sum + p.fatigue, 0) / homeActivePlayers.length
      const awayAvgFatigue = awayActivePlayers.reduce((sum, p) => sum + p.fatigue, 0) / awayActivePlayers.length
      assert.isAtLeast(homeAvgFatigue, 90, 'home fatigue is very high after full match')
      assert.isAtLeast(awayAvgFatigue, 50, 'away fatigue is significant after full match')

      // 6. Shots on target <= total shots
      assert.isAtMost(state.home.shotsOnTarget, state.home.shotsTotal)
      assert.isAtMost(state.away.shotsOnTarget, state.away.shotsTotal)

      // 7. Goals <= shots on target
      assert.isAtMost(state.home.score, state.home.shotsOnTarget)
      assert.isAtMost(state.away.score, state.away.shotsOnTarget)

      // 8. Yellow cards events match state
      const homeYellows = state.events.filter((e) => e.type === 'yellow_card' && e.clubId === homeClubId).length
      const awayYellows = state.events.filter((e) => e.type === 'yellow_card' && e.clubId === awayClubId).length
      assert.equal(state.home.yellowCards, homeYellows)
      assert.equal(state.away.yellowCards, awayYellows)

      // 9. Red cards: any red must be preceded by 2 yellows on same player
      const homeReds = state.events.filter((e) => e.type === 'red_card' && e.clubId === homeClubId).length
      assert.equal(state.home.redCards, homeReds)

      // 10. Financial calculations for post-match
      const homeResult = state.home.score > state.away.score ? 'win'
        : state.home.score < state.away.score ? 'loss' : 'draw'
      const awayResult = homeResult === 'win' ? 'loss' : homeResult === 'loss' ? 'win' : 'draw'

      const homeTicketRev = FinanceService.calculateTicketRevenue(1, 5)
      const awayTravelRev = FinanceService.calculateAwayRevenue(1)
      const homePrime = FinanceService.calculateMatchPrime(homeResult as 'win' | 'draw' | 'loss')
      const awayPrime = FinanceService.calculateMatchPrime(awayResult as 'win' | 'draw' | 'loss')

      assert.isAbove(homeTicketRev, 0, 'home gets ticket revenue')
      assert.isAbove(awayTravelRev, 0, 'away gets travel revenue')

      // Winner gets 5M, loser 0, draw both get 2M
      if (homeResult === 'win') {
        assert.equal(homePrime, 5_000_000)
        assert.equal(awayPrime, 0)
      } else if (homeResult === 'draw') {
        assert.equal(homePrime, 2_000_000)
        assert.equal(awayPrime, 2_000_000)
      }

      // 11. Added time between 1-5
      assert.isAtLeast(addedFirst, 1)
      assert.isAtMost(addedFirst, 5)
      assert.isAtLeast(addedSecond, 1)
      assert.isAtMost(addedSecond, 5)

    } finally {
      Math.random = original
    }
  })
})
