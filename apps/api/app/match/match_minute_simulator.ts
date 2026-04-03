import type { MatchEvent, MatchZone } from '@regista/shared'
import type { MatchState } from './match_state.js'
import {
    possessionChance,
    shotChance,
    shotOnTargetChance,
    goalChance,
    foulChance,
    yellowCardChance,
    injuryChance,
    fatiguePerMinute,
} from './match_probability.js'
import {
    midfieldStrength,
    attackStrength,
    defenseStrength,
    getGoalkeeper,
    getRandomAttacker,
} from './match_state.js'

function random(): number {
    return Math.random()
}

export function simulateMinute(state: MatchState): MatchEvent[] {
    const events: MatchEvent[] = []
    const minute = state.minute

    // 1. Determine possession
    const homeMid = midfieldStrength(state.home)
    const awayMid = midfieldStrength(state.away)
    const homePoss = possessionChance(homeMid, awayMid, state.home.tactics.mentality, state.away.tactics.mentality)
    const homeHasBall = random() < homePoss

    const attacking = homeHasBall ? state.home : state.away
    const defending = homeHasBall ? state.away : state.home

    attacking.possessionMinutes++

    // 2. Determine zone
    const zone: MatchZone = random() < 0.4 ? 'midfield' : random() < 0.7 ? 'attack' : 'defense'

    // 3. Shot attempt?
    if (zone === 'attack') {
        const attackStr = attackStrength(attacking)
        const defStr = defenseStrength(defending)
        const shotProb = shotChance(attackStr, defStr, attacking.tactics.mentality)

        if (random() < shotProb) {
            const shooter = getRandomAttacker(attacking)
            if (shooter) {
                attacking.shotsTotal++

                // On target?
                const onTarget = random() < shotOnTargetChance(shooter.shooting)

                if (onTarget) {
                    attacking.shotsOnTarget++
                    const gk = getGoalkeeper(defending)
                    const gkOvr = gk ? (gk.reflexes + gk.diving) / 2 : 30
                    const isGoal = random() < goalChance(shooter.shooting, shooter.composure, gkOvr)

                    if (isGoal) {
                        attacking.score++
                        events.push({
                            matchId: state.matchId,
                            minute,
                            type: 'goal',
                            clubId: attacking.clubId,
                            playerId: shooter.playerId,
                            zone: 'attack',
                            outcome: 'success',
                            metadata: { scorerName: shooter.playerId },
                        })

                        if (state.status === 'first_half') state.goalsFirstHalf++
                        else state.goalsSecondHalf++
                    } else {
                        defending.saves++
                        events.push({
                            matchId: state.matchId,
                            minute,
                            type: 'save',
                            clubId: defending.clubId,
                            playerId: gk?.playerId,
                            zone: 'attack',
                            outcome: 'success',
                        })
                    }
                } else {
                    events.push({
                        matchId: state.matchId,
                        minute,
                        type: 'shot_off_target',
                        clubId: attacking.clubId,
                        playerId: shooter.playerId,
                        zone: 'attack',
                        outcome: 'failure',
                    })
                }
            }
        }
    }

    // 4. Foul check
    if (random() < foulChance(defending.tactics.pressing)) {
        defending.fouls++

        const fouler = defending.onPitch.find((p) => !p.isOut && p.position !== 'GK')
        if (fouler) {
            events.push({
                matchId: state.matchId,
                minute,
                type: 'foul',
                clubId: defending.clubId,
                playerId: fouler.playerId,
                zone,
                outcome: 'neutral',
            })

            // Yellow card check
            if (random() < yellowCardChance()) {
                fouler.yellowCards++
                defending.yellowCards++

                if (state.status === 'first_half') state.cardsFirstHalf++
                else state.cardsSecondHalf++

                if (fouler.yellowCards >= 2) {
                    // Second yellow = red
                    fouler.isOut = true
                    defending.redCards++
                    events.push({
                        matchId: state.matchId,
                        minute,
                        type: 'red_card',
                        clubId: defending.clubId,
                        playerId: fouler.playerId,
                        zone,
                        outcome: 'neutral',
                    })
                } else {
                    events.push({
                        matchId: state.matchId,
                        minute,
                        type: 'yellow_card',
                        clubId: defending.clubId,
                        playerId: fouler.playerId,
                        zone,
                        outcome: 'neutral',
                    })
                }
            }

            // Corner chance from foul near goal
            if (zone === 'attack' && random() < 0.15) {
                attacking.corners++
                events.push({
                    matchId: state.matchId,
                    minute,
                    type: 'corner',
                    clubId: attacking.clubId,
                    zone: 'attack',
                    outcome: 'neutral',
                })
            }
        }
    }

    // 5. Injury check (rare)
    for (const team of [state.home, state.away]) {
        for (const player of team.onPitch) {
            if (player.isOut) continue
            if (random() < injuryChance(player.fatigue)) {
                player.isOut = true
                events.push({
                    matchId: state.matchId,
                    minute,
                    type: 'injury',
                    clubId: team.clubId,
                    playerId: player.playerId,
                    zone: 'midfield',
                    outcome: 'neutral',
                    metadata: { injuryType: 'muscle strain' },
                })

                if (state.status === 'first_half') state.injuriesFirstHalf++
                else state.injuriesSecondHalf++
            }
        }
    }

    // 6. Fatigue update
    for (const team of [state.home, state.away]) {
        const fatigueInc = fatiguePerMinute(team.tactics.pressing, team.tactics.tempo)
        for (const player of team.onPitch) {
            if (!player.isOut) {
                player.fatigue = Math.min(100, player.fatigue + fatigueInc)
            }
        }
    }

    return events
}
