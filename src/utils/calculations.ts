import { EnergySettings, CalculationResult } from '../types'

export const calculateCharging = (
  socInitial: number,
  socFinal: number,
  batteryCapacity: number,
  chargingPower: number,
  targetTime: string
): CalculationResult => {
  const percentageNeeded = socFinal - socInitial
  const kwhNeeded = (percentageNeeded / 100) * batteryCapacity
  const durationHours = kwhNeeded / chargingPower
  
  const [targetHour, targetMinute] = targetTime.split(':').map(Number)
  const targetDate = new Date()
  targetDate.setHours(targetHour, targetMinute, 0, 0)
  const startDate = new Date(targetDate.getTime() - durationHours * 60 * 60 * 1000)
  const startTime = startDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  
  return { startTime, endTime: targetTime, kwhNeeded, duration: durationHours, percentageNeeded }
}

export const getEnergyCost = (tariffType: string, fasce: any, monorariaPrice: number, targetTime: string): number => {
  if (tariffType === 'monoraria') return monorariaPrice
  const hour = parseInt(targetTime.split(':')[0])
  if (hour >= 8 && hour < 19) return fasce.F1
  if (hour >= 19 && hour < 23) return fasce.F2
  return fasce.F3
}

export const calculateCost = (kwh: number, type: 'home' | 'public', operatorCost: number, energyCost: number): number => {
  if (type === 'public') return kwh * operatorCost
  return kwh * energyCost
}