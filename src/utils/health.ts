// Apple Health / HealthKit is iOS-only — see health.ios.ts for the real
// implementation, same platform-split pattern as health-connection-status.
export async function getTodayBurnedCalories(): Promise<number | null> {
  return null;
}
