import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuth } from '~/hooks/use-auth'
import { createClub } from '~/lib/club'
import { COLOR_PRESETS, LOGO_PRESETS } from '@regista/shared'
import { StepIndicator } from '~/components/onboarding/step-indicator'
import { ClubNameStep } from '~/components/onboarding/club-name-step'
import { ClubColorsStep } from '~/components/onboarding/club-colors-step'
import { ClubLogoStep } from '~/components/onboarding/club-logo-step'
import { ClubConfirmationStep } from '~/components/onboarding/club-confirmation-step'
import { useQueryClient } from '@tanstack/react-query'

export const Route = createFileRoute('/onboarding')({
  component: OnboardingPage,
})

function OnboardingPage() {
  const { user, isAuthenticated, isLoading, setUser } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [primaryColor, setPrimaryColor] = useState<string>(COLOR_PRESETS[5])
  const [secondaryColor, setSecondaryColor] = useState<string>(COLOR_PRESETS[19])
  const [logoId, setLogoId] = useState<string>(LOGO_PRESETS[0])
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/login' })
    }
  }, [isAuthenticated, isLoading, navigate])

  useEffect(() => {
    if (!isLoading && user?.hasClub) {
      navigate({ to: '/dashboard' })
    }
  }, [user, isLoading, navigate])

  if (isLoading || !isAuthenticated || user?.hasClub) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const handleCreate = async () => {
    setIsCreating(true)
    setError(null)
    try {
      const result = await createClub({
        name,
        primaryColor,
        secondaryColor,
        logoId,
      })

      // Update auth context with club info
      if (user) {
        setUser({ ...user, hasClub: true, clubId: result.club.id })
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['club'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })

      navigate({ to: '/dashboard' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create club')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Regista</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create your club</p>
        </div>

        <StepIndicator currentStep={step} totalSteps={4} />

        {step === 1 && (
          <ClubNameStep value={name} onChange={setName} onNext={() => setStep(2)} />
        )}
        {step === 2 && (
          <ClubColorsStep
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            onChangePrimary={setPrimaryColor}
            onChangeSecondary={setSecondaryColor}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <ClubLogoStep
            selected={logoId}
            primaryColor={primaryColor}
            onSelect={setLogoId}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <ClubConfirmationStep
            name={name}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            logoId={logoId}
            isCreating={isCreating}
            error={error}
            onCreate={handleCreate}
            onBack={() => setStep(3)}
          />
        )}
      </div>
    </div>
  )
}
