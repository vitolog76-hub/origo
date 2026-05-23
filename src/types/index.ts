export interface ChargingSession {
  id: string
  date: string
  startTime: string
  endTime: string
  socInitial: number
  socFinal: number
  kwhCharged: number
  chargingPower: number
  totalCost: number
  locationType: 'home' | 'public'
  energyCost: number
  energyProvider?: string
  userId?: string
  createdAt?: any
  areraCost?: number
  providerVariableCost?: number
  providerFixedPortion?: number
}

export interface EnergySettings {
  tariffType: 'monoraria' | 'fasce'
  monorariaPrice: number
  fasce: { F1: number; F2: number; F3: number }
}

export interface CalculationResult {
  startTime: string
  endTime: string
  kwhNeeded: number
  duration: number
  percentageNeeded: number
}