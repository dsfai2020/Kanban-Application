/**
 * Time Gradient Utility
 * Creates dynamic color gradients based on time of day, timezone, and daylight savings
 */

/**
 * Get the current timezone and daylight savings status
 */
export function getTimezoneInfo(date: Date = new Date()) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  
  // Check if currently in daylight saving time
  const january = new Date(date.getFullYear(), 0, 1)
  const july = new Date(date.getFullYear(), 6, 1)
  const stdOffset = Math.max(january.getTimezoneOffset(), july.getTimezoneOffset())
  const isDST = date.getTimezoneOffset() < stdOffset
  
  return {
    timezone,
    isDST,
    offset: date.getTimezoneOffset()
  }
}

/**
 * Calculate approximate sunrise and sunset times based on date and timezone
 * Uses simplified astronomical calculations for US timezones
 */
export function getSunTimes(date: Date = new Date()) {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000)
  
  // Approximate sunrise/sunset using seasonal variation
  // These are rough averages for continental US (latitude ~40°N)
  const seasonalVariation = Math.sin((dayOfYear - 80) * 2 * Math.PI / 365)
  
  // Base times (in hours, 24h format)
  const baseSunrise = 6.5 // ~6:30 AM at equinox
  const baseSunset = 18.5 // ~6:30 PM at equinox
  const variation = 2.5 // Hours of variation throughout the year
  
  const sunrise = baseSunrise - (seasonalVariation * variation)
  const sunset = baseSunset + (seasonalVariation * variation)
  
  // Dawn starts ~1 hour before sunrise, Dusk ends ~1 hour after sunset
  const dawn = Math.max(0, sunrise - 1)
  const dusk = Math.min(24, sunset + 1)
  
  return {
    dawn: Math.round(dawn * 10) / 10,
    sunrise: Math.round(sunrise * 10) / 10,
    sunset: Math.round(sunset * 10) / 10,
    dusk: Math.round(dusk * 10) / 10
  }
}

/**
 * Get the background color for a specific hour based on time of day
 * Returns elegant gradient colors for day/night cycle
 */
export function getTimeOfDayColor(hour: number, date: Date = new Date()): string {
  const sunTimes = getSunTimes(date)
  
  // Color palette - elegant and subtle
  const colors = {
    // Night: Deep blue-purple
    night: '#1a1a2e',
    // Pre-dawn: Purple-blue
    preDawn: '#2d2a4a',
    // Dawn: Soft purple-pink
    dawn: '#4a4266',
    // Early morning: Warm pink-orange
    earlyMorning: '#6b5b7a',
    // Morning: Light golden
    morning: '#8b7f95',
    // Day: Bright sky blue
    day: '#a8b5c7',
    // Afternoon: Warm light blue
    afternoon: '#9db4ce',
    // Evening: Golden hour
    evening: '#8b92a8',
    // Dusk: Purple-orange
    dusk: '#5d5979',
    // Late dusk: Deep purple
    lateDusk: '#3a3654'
  }
  
  // Map hours to colors with smooth transitions
  if (hour < sunTimes.dawn) {
    // Deep night
    return colors.night
  } else if (hour < sunTimes.dawn + 0.5) {
    // Pre-dawn
    return colors.preDawn
  } else if (hour < sunTimes.sunrise - 0.5) {
    // Dawn
    return colors.dawn
  } else if (hour < sunTimes.sunrise) {
    // Early morning
    return colors.earlyMorning
  } else if (hour < sunTimes.sunrise + 2) {
    // Morning
    return colors.morning
  } else if (hour < 12) {
    // Late morning to noon
    return colors.day
  } else if (hour < sunTimes.sunset - 2) {
    // Afternoon
    return colors.afternoon
  } else if (hour < sunTimes.sunset) {
    // Late afternoon / golden hour
    return colors.evening
  } else if (hour < sunTimes.sunset + 0.5) {
    // Sunset
    return colors.dusk
  } else if (hour < sunTimes.dusk) {
    // Late dusk
    return colors.lateDusk
  } else {
    // Night
    return colors.night
  }
}

/**
 * Get a gradient background for a time slot
 * Creates smooth vertical gradient for better visual appeal
 */
export function getTimeSlotGradient(hour: number, date: Date = new Date()): string {
  const currentColor = getTimeOfDayColor(hour, date)
  const nextColor = getTimeOfDayColor(hour + 1, date)
  
  return `linear-gradient(to bottom, ${currentColor}, ${nextColor})`
}

/**
 * Check if the hour is during daytime
 */
export function isDaytime(hour: number, date: Date = new Date()): boolean {
  const sunTimes = getSunTimes(date)
  return hour >= sunTimes.sunrise && hour < sunTimes.sunset
}

/**
 * Get text color that contrasts well with the time of day background
 */
export function getContrastTextColor(hour: number, date: Date = new Date()): string {
  const sunTimes = getSunTimes(date)
  
  // Use light text during night and dawn/dusk
  if (hour < sunTimes.sunrise || hour >= sunTimes.sunset) {
    return 'rgba(255, 255, 255, 0.9)'
  }
  
  // Use darker text during day
  return 'rgba(0, 0, 0, 0.7)'
}

/**
 * Format a decimal hour into readable time string
 */
export function formatSunTime(decimalHour: number): string {
  const hours = Math.floor(decimalHour)
  const minutes = Math.round((decimalHour - hours) * 60)
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`
}

/**
 * Get dawn/dusk label for a specific hour if applicable
 */
export function getSunTimeLabel(hour: number, date: Date = new Date()): { label: string; time: string } | null {
  const sunTimes = getSunTimes(date)
  
  // Check if this hour contains dawn
  if (hour <= sunTimes.dawn && hour + 1 > sunTimes.dawn) {
    return {
      label: 'Dawn',
      time: formatSunTime(sunTimes.dawn)
    }
  }
  
  // Check if this hour contains dusk
  if (hour <= sunTimes.dusk && hour + 1 > sunTimes.dusk) {
    return {
      label: 'Dusk',
      time: formatSunTime(sunTimes.dusk)
    }
  }
  
  return null
}
