import { JobsOptions, Queue } from 'bullmq'
import { bullmqRedis } from '#services/redis'

export type QueueName = 'email' | 'match' | 'season' | 'transfer' | 'training' | 'finance' | 'moderation'

const DEFAULT_JOB_OPTIONS: JobsOptions = {
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 2_000,
    },
    removeOnComplete: 1_000,
    removeOnFail: 5_000,
}

class QueueService {
    #queues = new Map<QueueName, Queue>()

    #getQueue(name: QueueName): Queue {
        const existingQueue = this.#queues.get(name)
        if (existingQueue) {
            return existingQueue
        }

        const queue = new Queue(name, {
            connection: bullmqRedis,
            defaultJobOptions: DEFAULT_JOB_OPTIONS,
        })

        this.#queues.set(name, queue)
        return queue
    }

    async enqueue<DataType = unknown>(
        queueName: QueueName,
        jobName: string,
        data: DataType,
        options?: JobsOptions
    ) {
        return this.#getQueue(queueName).add(jobName, data, options)
    }

    async closeAll() {
        await Promise.all([...this.#queues.values()].map((queue) => queue.close()))
    }
}

export const queueService = new QueueService()
