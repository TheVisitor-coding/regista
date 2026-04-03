export const TrainingFocus = {
  PHYSICAL: 'physical',
  TECHNICAL: 'technical',
  MENTAL: 'mental',
  DEFENSIVE: 'defensive',
  SET_PIECES: 'set_pieces',
  REST: 'rest',
} as const

export type TrainingFocus = (typeof TrainingFocus)[keyof typeof TrainingFocus]

export const GKTrainingFocus = {
  REFLEXES: 'reflexes',
  DISTRIBUTION: 'distribution',
  PLACEMENT: 'placement',
  REST: 'rest',
} as const

export type GKTrainingFocus = (typeof GKTrainingFocus)[keyof typeof GKTrainingFocus]

export interface TrainingProgram {
  gkFocus: GKTrainingFocus
  defFocus: TrainingFocus
  midFocus: TrainingFocus
  attFocus: TrainingFocus
  individualOverrides: Record<string, TrainingFocus | GKTrainingFocus> // playerId -> focus
}
