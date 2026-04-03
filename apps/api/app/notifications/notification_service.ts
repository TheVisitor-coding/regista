import { db } from '@regista/db'
import { notifications, clubStaff } from '@regista/db'
import { eq } from 'drizzle-orm'

interface CreateNotificationData {
    staffRole: 'assistant' | 'doctor' | 'sporting_director' | 'secretary'
    category: 'match' | 'injury' | 'finance' | 'transfer' | 'tactic' | 'system'
    priority: 'critical' | 'important' | 'warning' | 'info' | 'positive'
    title: string
    message: string
    actionUrl?: string
    isPinned?: boolean
    metadata?: Record<string, unknown>
}

export class NotificationService {
    static async create(clubId: string, data: CreateNotificationData) {
        const [notification] = await db
            .insert(notifications)
            .values({
                clubId,
                staffRole: data.staffRole,
                category: data.category,
                priority: data.priority,
                title: data.title,
                message: data.message,
                actionUrl: data.actionUrl ?? null,
                isPinned: data.isPinned ?? false,
                metadata: data.metadata ?? null,
            })
            .returning()

        return notification
    }

    static async createWelcomeNotifications(clubId: string) {
        // Get staff members for this club
        const staff = await db
            .select()
            .from(clubStaff)
            .where(eq(clubStaff.clubId, clubId))

        const staffByRole = new Map(staff.map((s) => [s.role, s]))

        const welcomeMessages: CreateNotificationData[] = [
            {
                staffRole: 'secretary',
                category: 'system',
                priority: 'info',
                title: 'Welcome to your new club!',
                message: `Congratulations on founding your club! I'm ${staffByRole.get('secretary')?.firstName ?? 'your secretary'}, your club secretary. I'll keep you informed about match schedules, results, and league updates.`,
            },
            {
                staffRole: 'assistant',
                category: 'tactic',
                priority: 'info',
                title: 'Time to set up your tactics',
                message: `Hello coach! I'm ${staffByRole.get('assistant')?.firstName ?? 'your assistant'}, your assistant coach. When you're ready, head to the Tactics page to set up your formation and match strategy.`,
                actionUrl: '/tactics',
            },
            {
                staffRole: 'doctor',
                category: 'system',
                priority: 'info',
                title: 'Squad fitness report',
                message: `Hi coach, I'm ${staffByRole.get('doctor')?.firstName ?? 'your doctor'}, the team doctor. Your squad is in good shape. I'll alert you about any injuries or fatigue concerns.`,
                actionUrl: '/squad',
            },
            {
                staffRole: 'sporting_director',
                category: 'finance',
                priority: 'info',
                title: 'Budget overview',
                message: `Welcome! I'm ${staffByRole.get('sporting_director')?.firstName ?? 'your director'}, your sporting director. Your starting budget is 5,000,000 G$. I'll advise on transfers and financial matters.`,
                actionUrl: '/finances',
            },
        ]

        for (const msg of welcomeMessages) {
            await NotificationService.create(clubId, msg)
        }
    }
}
