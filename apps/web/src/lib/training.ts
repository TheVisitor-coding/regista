import { apiClient } from '~/lib/api-client'
import type { TrainingProgram } from '@regista/shared'

export async function fetchTrainingProgram(): Promise<TrainingProgram> {
  return apiClient<TrainingProgram>('/training')
}

export async function updateTrainingProgram(data: Partial<TrainingProgram>): Promise<void> {
  await apiClient('/training', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
