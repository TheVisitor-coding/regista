import type { HttpContext } from '@adonisjs/core/http'
import { OnboardingService } from './onboarding_service.js'

export default class OnboardingController {
    async status({ auth, response }: HttpContext) {
        const missions = await OnboardingService.getMissions(auth.userId)
        const allCompleted = missions.every((m) => m.completed && m.claimed)

        return response.ok({
            missions,
            allCompleted,
        })
    }

    async completeMission({ auth, params, response }: HttpContext) {
        await OnboardingService.completeMission(auth.userId, params.missionKey)
        return response.ok({ success: true })
    }

    async claimReward({ auth, params, response }: HttpContext) {
        const claimed = await OnboardingService.claimReward(auth.userId, params.missionKey)

        if (!claimed) {
            return response.badRequest({ error: 'Cannot claim this reward' })
        }

        return response.ok({ success: true })
    }
}
