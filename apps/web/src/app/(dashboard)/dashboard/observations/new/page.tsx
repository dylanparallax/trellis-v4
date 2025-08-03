import { ObservationForm } from '@/components/observations/observation-form'

export default function NewObservationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Observation</h1>
        <p className="text-muted-foreground">
          Conduct a classroom observation and get AI-enhanced feedback.
        </p>
      </div>

      <ObservationForm 
        onSubmit={(data) => {
          console.log('Observation submitted:', data)
          // Handle submission
        }}
      />
    </div>
  )
} 