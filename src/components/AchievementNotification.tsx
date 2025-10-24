import { useState, useEffect } from 'react'
import { Trophy, Award, Medal, Star, Crown, X } from 'lucide-react'
import type { Achievement, BadgeTier } from '../types/achievements'
import './AchievementNotification.css'

interface AchievementNotificationProps {
  achievement: Achievement
  tier: BadgeTier
  isVisible: boolean
  onClose: () => void
}

const ICON_MAP = {
  trophy: Trophy,
  ribbon: Award,
  medal: Medal,
  star: Star,
  crown: Crown
}

export default function AchievementNotification({ 
  achievement, 
  tier, 
  isVisible, 
  onClose 
}: AchievementNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const IconComponent = ICON_MAP[achievement.icon]

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        handleClose()
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [isVisible])

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => {
      onClose()
    }, 300) // Wait for exit animation
  }

  const getTierColor = (tier: BadgeTier) => {
    const colors = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2',
      diamond: '#B9F2FF'
    }
    return colors[tier]
  }

  const getTierEmoji = (tier: BadgeTier) => {
    const emojis = {
      bronze: '🥉',
      silver: '🥈', 
      gold: '🥇',
      platinum: '🏆',
      diamond: '💎'
    }
    return emojis[tier]
  }

  if (!isVisible) return null

  return (
    <>
      {/* Confetti Background */}
      <div className="confetti-container">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`
            }}
          />
        ))}
      </div>

      {/* Notification Card */}
      <div 
        className={`achievement-notification ${isAnimating ? 'visible' : ''}`}
        style={{ 
          borderColor: getTierColor(tier),
          boxShadow: `0 0 30px ${getTierColor(tier)}40`
        }}
      >
        <button 
          className="notification-close"
          onClick={handleClose}
          aria-label="Close notification"
        >
          <X size={16} />
        </button>

        <div className="notification-content">
          <div className="notification-header">
            <div 
              className="achievement-icon-large"
              style={{ color: getTierColor(tier) }}
            >
              <IconComponent size={48} />
            </div>
            <div className="sparkle-effects">
              {Array.from({ length: 8 }).map((_, i) => (
                <div 
                  key={i} 
                  className="sparkle"
                  style={{ 
                    animationDelay: `${i * 0.2}s`,
                    left: `${20 + (i % 3) * 25}%`,
                    top: `${10 + Math.floor(i / 3) * 25}%`
                  }}
                >
                  ✨
                </div>
              ))}
            </div>
          </div>

          <div className="notification-text">
            <h2 className="achievement-unlocked-title">
              🎉 Achievement Unlocked! 🎉
            </h2>
            <h3 
              className="achievement-name"
              style={{ color: getTierColor(tier) }}
            >
              {achievement.name}
            </h3>
            <div 
              className="achievement-tier-badge"
              style={{ 
                backgroundColor: getTierColor(tier),
                color: tier === 'gold' || tier === 'platinum' ? '#000' : '#fff'
              }}
            >
              {getTierEmoji(tier)} {tier.toUpperCase()}
            </div>
            <p className="achievement-description">
              {achievement.description}
            </p>
          </div>
        </div>

        <div className="celebration-glow" style={{ backgroundColor: getTierColor(tier) }} />
      </div>
    </>
  )
}