export interface ApiError {
  error: string
  message?: string
  errors?: FieldError[]
}

export interface FieldError {
  field: string
  message: string
  rule: string
}

export interface AvailabilityCheck {
  available: boolean
  reason?: string
}
