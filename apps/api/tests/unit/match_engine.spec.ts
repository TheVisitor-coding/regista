import { test } from '@japa/runner'
import {
  possessionChance,
  shotChance,
  shotOnTargetChance,
  goalChance,
  foulChance,
  yellowCardChance,
  injuryChance,
  fatiguePerMinute,
  addedTimeMinutes,
} from '../../app/match/match_probability.js'
import { simulateMinute } from '../../app/match/match_minute_simulator.js'
import {
  midfieldStrength,
  attackStrength,
  defenseStrength,
  type MatchState,
  type TeamState,
  type PlayerState,
} from '../../app/match/match_state.js'

// ---------- Seeded PRNG (Mulberry32) ----------
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function withSeed<T>(seed: number, fn: () => T): T {
  const original = Math.random
  Math.random = mulberry32(seed)
  try {
    return fn()
  } finally {
    Math.random = original
  }
}

// ---------- Helpers ----------
function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    playerId: crypto.randomUUID(),
    position: 'CM',
    overall: 70,
    fatigue: 0,
    yellowCards: 0,
    isOut: false,
    shooting: 65,
    passing: 70,
    vision: 68,
    tackling: 60,
    dribbling: 65,
    composure: 65,
    workRate: 70,
    stamina: 70,
    pace: 70,
    heading: 60,
    crossing: 65,
    marking: 60,
    reflexes: 30,
    diving: 30,
    ...overrides,
  }
}

function makeTeam(overrides: Partial<TeamState> = {}, playerOverrides: Partial<PlayerState> = {}): TeamState {
  return {
    clubId: crypto.randomUUID(),
    isAi: false,
    aiProfile: null,
    tactics: { mentality: 'balanced', pressing: 'medium', passingStyle: 'mixed', width: 'normal', tempo: 'normal', defensiveLine: 'normal' },
    onPitch: [
      makePlayer({ position: 'GK', reflexes: 70, diving: 70, ...playerOverrides }),
      makePlayer({ position: 'CB', tackling: 72, marking: 70, heading: 68, ...playerOverrides }),
      makePlayer({ position: 'CB', tackling: 70, marking: 68, heading: 66, ...playerOverrides }),
      makePlayer({ position: 'LB', tackling: 65, marking: 63, heading: 60, ...playerOverrides }),
      makePlayer({ position: 'RB', tackling: 65, marking: 63, heading: 60, ...playerOverrides }),
      makePlayer({ position: 'CDM', tackling: 68, marking: 66, heading: 64, passing: 68, vision: 65, workRate: 72, ...playerOverrides }),
      makePlayer({ position: 'CM', passing: 72, vision: 70, workRate: 68, ...playerOverrides }),
      makePlayer({ position: 'CM', passing: 70, vision: 68, workRate: 66, ...playerOverrides }),
      makePlayer({ position: 'LW', shooting: 72, composure: 68, dribbling: 74, ...playerOverrides }),
      makePlayer({ position: 'RW', shooting: 70, composure: 66, dribbling: 72, ...playerOverrides }),
      makePlayer({ position: 'ST', shooting: 78, composure: 75, dribbling: 70, ...playerOverrides }),
    ],
    bench: [],
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
    ...overrides,
  }
}

function makeMatchState(homeOverrides: Partial<TeamState> = {}, awayOverrides: Partial<TeamState> = {}): MatchState {
  return {
    matchId: crypto.randomUUID(),
    status: 'first_half',
    minute: 1,
    home: makeTeam(homeOverrides),
    away: makeTeam(awayOverrides),
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
}

// ==================== POSSESSION ====================

test.group('Match Engine — Possession', () => {
  test('possession favorable si midfield strength supérieur', ({ assert }) => {
    // Home midfield = 80, Away = 50 → home should dominate
    const chance = possessionChance(80, 50, 'balanced', 'balanced')
    assert.isAbove(chance, 0.55)
    assert.isBelow(chance, 0.70)
  })

  test('possession à 50/50 si midfield strength égal', ({ assert }) => {
    const chance = possessionChance(70, 70, 'balanced', 'balanced')
    assert.closeTo(chance, 0.5, 0.001)
  })

  test('mentalité offensive augmente la possession', ({ assert }) => {
    const balanced = possessionChance(70, 70, 'balanced', 'balanced')
    const offensive = possessionChance(70, 70, 'offensive', 'balanced')
    assert.isAbove(offensive, balanced)
  })

  test('mentalité défensive réduit la possession', ({ assert }) => {
    const balanced = possessionChance(70, 70, 'balanced', 'balanced')
    const defensive = possessionChance(70, 70, 'defensive', 'balanced')
    assert.isBelow(defensive, balanced)
  })
})

// ==================== TIRS ====================

test.group('Match Engine — Tirs', () => {
  test('plus de tirs quand attaque forte vs défense faible', ({ assert }) => {
    const strong = shotChance(85, 50, 'balanced')
    const weak = shotChance(50, 85, 'balanced')
    assert.isAbove(strong, weak)
  })

  test('probabilité de tir plafonnée à 0.35', ({ assert }) => {
    // Extreme: huge attack, tiny defense, ultra_offensive
    const capped = shotChance(99, 30, 'ultra_offensive')
    assert.isAtMost(capped, 0.35)
  })

  test('mentalité ultra_offensive maximise les tirs', ({ assert }) => {
    const balanced = shotChance(70, 70, 'balanced')
    const ultraOff = shotChance(70, 70, 'ultra_offensive')
    assert.isAbove(ultraOff, balanced)
  })
})

// ==================== BUTS ====================

test.group('Match Engine — Buts', () => {
  test('probabilité de but augmente avec shooting + composure', ({ assert }) => {
    const low = goalChance(50, 50, 60)
    const high = goalChance(90, 90, 60)
    assert.isAbove(high, low)
  })

  test('probabilité de but diminue avec GK OVR élevé', ({ assert }) => {
    const weakGk = goalChance(75, 70, 40)
    const strongGk = goalChance(75, 70, 90)
    assert.isAbove(weakGk, strongGk)
  })

  test('probabilité de but plancher à 0.05', ({ assert }) => {
    // Worst attacker vs best GK
    const floor = goalChance(1, 1, 99)
    assert.isAtLeast(floor, 0.05)
  })

  test('probabilité de but plafond à 0.45', ({ assert }) => {
    // Best attacker vs worst GK
    const ceiling = goalChance(99, 99, 1)
    assert.isAtMost(ceiling, 0.45)
  })
})

// ==================== FAUTES ====================

test.group('Match Engine — Fautes', () => {
  test('pressing high génère plus de fautes', ({ assert }) => {
    const high = foulChance('high')
    const medium = foulChance('medium')
    assert.isAbove(high, medium)
  })

  test('pressing low génère moins de fautes', ({ assert }) => {
    const low = foulChance('low')
    const medium = foulChance('medium')
    assert.isBelow(low, medium)
  })
})

// ==================== FATIGUE ====================

test.group('Match Engine — Fatigue', () => {
  test('fatigue base avec pressing medium et tempo normal', ({ assert }) => {
    // 0.8 + 0.2*0.8 + 0.2*1.0 = 0.8 + 0.16 + 0.20 = 1.16
    const fatigue = fatiguePerMinute('medium', 'normal')
    assert.closeTo(fatigue, 1.16, 0.001)
  })

  test('pressing high accélère la fatigue', ({ assert }) => {
    const high = fatiguePerMinute('high', 'normal')
    const medium = fatiguePerMinute('medium', 'normal')
    assert.isAbove(high, medium)
  })

  test('tempo fast accélère la fatigue', ({ assert }) => {
    const fast = fatiguePerMinute('medium', 'fast')
    const normal = fatiguePerMinute('medium', 'normal')
    assert.isAbove(fast, normal)
  })
})

// ==================== BLESSURES ====================

test.group('Match Engine — Blessures', () => {
  test('probabilité de blessure base à fatigue 0 = 0.5%', ({ assert }) => {
    const chance = injuryChance(0)
    assert.closeTo(chance, 0.005, 0.0001)
  })

  test('probabilité de blessure augmente avec la fatigue', ({ assert }) => {
    const fresh = injuryChance(0)
    const tired = injuryChance(80)
    assert.isAbove(tired, fresh)
    // At fatigue 80: 0.005 * (1 + 80/100) = 0.005 * 1.8 = 0.009
    assert.closeTo(tired, 0.009, 0.0001)
  })
})

// ==================== TEMPS ADDITIONNEL ====================

test.group('Match Engine — Temps additionnel', () => {
  test('temps additionnel augmente avec les buts et cartons', ({ assert }) => {
    withSeed(42, () => {
      const quiet = addedTimeMinutes(0, 0, 0, 0)
      assert.isAtLeast(quiet, 1)
      assert.isAtMost(quiet, 5)
    })

    withSeed(42, () => {
      const busy = addedTimeMinutes(3, 4, 3, 2)
      // 1 + 3*0.5 + 4*0.5 + 3*0.3 + 2*1.0 + random = 1 + 1.5 + 2 + 0.9 + 2 + r = 7.4+r → capped at 5
      assert.equal(busy, 5)
    })
  })
})

// ==================== STRENGTH HELPERS ====================

test.group('Match Engine — Strength calculations', () => {
  test('midfieldStrength retourne la moyenne pondérée des milieux', ({ assert }) => {
    const team = makeTeam()
    const str = midfieldStrength(team)
    // CDM + 2 CM have passing/vision/workRate ~65-72, average should be around 67-70
    assert.isAbove(str, 60)
    assert.isBelow(str, 80)
  })

  test('attackStrength retourne la moyenne des attaquants', ({ assert }) => {
    const team = makeTeam()
    const str = attackStrength(team)
    // LW, RW, ST have shooting/composure/dribbling ~66-78, average ~70
    assert.isAbove(str, 60)
    assert.isBelow(str, 80)
  })

  test('defenseStrength retourne la moyenne des défenseurs', ({ assert }) => {
    const team = makeTeam()
    const str = defenseStrength(team)
    // CBs, LB, RB, CDM have tackling/marking/heading ~60-72
    assert.isAbove(str, 55)
    assert.isBelow(str, 80)
  })

  test('fatigue réduit la strength', ({ assert }) => {
    const fresh = makeTeam({}, { fatigue: 0 })
    const tired = makeTeam({}, { fatigue: 80 })
    assert.isAbove(midfieldStrength(fresh), midfieldStrength(tired))
  })
})

// ==================== SIMULATION COMPLÈTE ====================

test.group('Match Engine — Simulation complète (seeded)', () => {
  test('simulateMinute produit des events cohérents avec le state', ({ assert }) => {
    withSeed(12345, () => {
      const state = makeMatchState()
      const allEvents: any[] = []

      // Simulate 90 minutes
      for (let min = 1; min <= 90; min++) {
        state.minute = min
        if (min === 46) state.status = 'second_half'
        const events = simulateMinute(state)
        allEvents.push(...events)
        state.events.push(...events)
      }

      // Score = count of goal events
      const homeGoals = allEvents.filter((e) => e.type === 'goal' && e.clubId === state.home.clubId).length
      const awayGoals = allEvents.filter((e) => e.type === 'goal' && e.clubId === state.away.clubId).length
      assert.equal(state.home.score, homeGoals)
      assert.equal(state.away.score, awayGoals)

      // Possession minutes total = 90
      assert.equal(state.home.possessionMinutes + state.away.possessionMinutes, 90)

      // All players have accumulated fatigue
      for (const player of state.home.onPitch) {
        if (!player.isOut) assert.isAbove(player.fatigue, 0)
      }

      // Score is reasonable (0-10 range for a normal match)
      assert.isAtMost(state.home.score + state.away.score, 15)

      // Yellow cards tracked consistently
      const homeYellows = allEvents.filter((e) => e.type === 'yellow_card' && e.clubId === state.home.clubId).length
      const awayYellows = allEvents.filter((e) => e.type === 'yellow_card' && e.clubId === state.away.clubId).length
      assert.equal(state.home.yellowCards, homeYellows)
      assert.equal(state.away.yellowCards, awayYellows)
    })
  })
})
