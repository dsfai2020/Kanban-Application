/**
 * Sound Effects Utility
 * Provides gentle sound effects for UI interactions
 */

class SoundEffects {
  private audioContext: AudioContext | null = null
  private enabled: boolean = true

  constructor() {
    // Initialize AudioContext lazily on first use
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      // Context will be created on first play
    }
  }

  private getAudioContext(): AudioContext | null {
    if (!this.audioContext && typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (e) {
        console.warn('Web Audio API not supported')
        return null
      }
    }
    return this.audioContext
  }

  /**
   * Play a gentle completion sound
   * A pleasant two-tone chime effect
   */
  playCompletionSound() {
    if (!this.enabled) return

    const context = this.getAudioContext()
    if (!context) return

    try {
      const now = context.currentTime

      // Create gain node for volume control
      const gainNode = context.createGain()
      gainNode.connect(context.destination)
      gainNode.gain.setValueAtTime(0.15, now) // Gentle volume
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4)

      // First tone (higher pitch)
      const oscillator1 = context.createOscillator()
      oscillator1.connect(gainNode)
      oscillator1.type = 'sine'
      oscillator1.frequency.setValueAtTime(800, now) // E5 note
      oscillator1.start(now)
      oscillator1.stop(now + 0.15)

      // Second tone (lower pitch, slightly delayed)
      const oscillator2 = context.createOscillator()
      oscillator2.connect(gainNode)
      oscillator2.type = 'sine'
      oscillator2.frequency.setValueAtTime(600, now + 0.1) // D5 note
      oscillator2.start(now + 0.1)
      oscillator2.stop(now + 0.4)

    } catch (e) {
      console.warn('Error playing sound effect:', e)
    }
  }

  /**
   * Enable or disable sound effects
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  /**
   * Check if sound effects are enabled
   */
  isEnabled(): boolean {
    return this.enabled
  }
}

// Export a singleton instance
export const soundEffects = new SoundEffects()
