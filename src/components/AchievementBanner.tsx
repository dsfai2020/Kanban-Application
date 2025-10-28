import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Trophy, ChevronDown, ChevronUp, Award, Medal, Star, Crown } from 'lucide-react'
import { achievementManager } from '../utils/achievementManager'
import { ALL_ACHIEVEMENTS } from '../utils/achievements'
import type { Achievement } from '../types/achievements'
import './AchievementBanner.css'

interface AchievementWithStatus {
  achievement: Achievement
  status: {
    isUnlocked: boolean
    currentProgress: number
    percentage: number
  }
}

const ICON_MAP = {
  trophy: Trophy,
  ribbon: Award,
  medal: Medal,
  star: Star,
  crown: Crown
}

export default function AchievementBanner() {
  const [achievements, setAchievements] = useState<AchievementWithStatus[]>([])
  const [isExpanded, setIsExpanded] = useState(true) // Default to expanded
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number; showBelow: boolean } | null>(null)

  useEffect(() => {
    // Load achievement data
    const loadAchievements = () => {
      const achievementsWithStatus = achievementManager.getAllAchievementsWithStatus()
      setAchievements(achievementsWithStatus)
    }

    loadAchievements()

    // Refresh achievements every few seconds to catch updates
    const interval = setInterval(loadAchievements, 3000)

    return () => clearInterval(interval)
  }, [])

  const unlockedAchievements = achievements.filter(a => a.status.isUnlocked)
  const totalAchievements = ALL_ACHIEVEMENTS.length

  const handleBadgeHover = (achievementId: string, event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const tooltipWidth = 280
    const tooltipHeight = 150 // Approximate height
    const padding = 10
    
    let left = rect.left + rect.width / 2
    let top = rect.top - padding
    
    // Adjust horizontal position if tooltip would go off screen
    if (left - tooltipWidth / 2 < padding) {
      // Too far left
      left = tooltipWidth / 2 + padding
    } else if (left + tooltipWidth / 2 > window.innerWidth - padding) {
      // Too far right
      left = window.innerWidth - tooltipWidth / 2 - padding
    }
    
    // Adjust vertical position if tooltip would go off top
    if (top - tooltipHeight < padding) {
      // Show below badge instead
      top = rect.bottom + padding
      setTooltipPosition({ top, left, showBelow: true })
    } else {
      setTooltipPosition({ top, left, showBelow: false })
    }
    
    setHoveredBadge(achievementId)
  }

  const handleBadgeLeave = () => {
    setHoveredBadge(null)
    setTooltipPosition(null)
  }

  const getBadgeStyle = (achievement: Achievement) => {
    return {
      background: `linear-gradient(135deg, ${achievement.color}20, ${achievement.color}40)`,
      border: `2px solid ${achievement.color}`,
      color: achievement.color,
      boxShadow: `0 0 20px ${achievement.color}30`
    }
  }

  const getIconStyle = (achievement: Achievement) => {
    return {
      color: achievement.color,
      filter: `drop-shadow(0 0 8px ${achievement.color}50)`
    }
  }

  return (
    <div className="achievement-banner">
      <div 
        className="achievement-banner-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="achievement-banner-title">
          <Trophy size={20} className="achievement-banner-icon" />
          <span className="achievement-banner-text">
            Achievements
          </span>
          <span className="achievement-banner-count">
            {unlockedAchievements.length}/{totalAchievements}
          </span>
        </div>
        <button 
          className="achievement-banner-toggle"
          aria-label={isExpanded ? 'Collapse achievements' : 'Expand achievements'}
        >
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isExpanded && (
        <div className="achievement-banner-content">
          {unlockedAchievements.length === 0 ? (
            <div className="achievement-banner-empty">
              <p>No achievements unlocked yet!</p>
              <p className="achievement-banner-hint">
                Complete cards, create boards, and maintain daily streaks to unlock achievements.
              </p>
            </div>
          ) : (
            <div className="achievement-banner-grid">
              {unlockedAchievements.map(({ achievement }) => {
                const IconComponent = ICON_MAP[achievement.icon]
                return (
                  <div 
                    key={achievement.id} 
                    className="achievement-banner-item"
                    style={getBadgeStyle(achievement)}
                    onMouseEnter={(e) => handleBadgeHover(achievement.id, e)}
                    onMouseLeave={handleBadgeLeave}
                  >
                    <div className="achievement-icon" style={getIconStyle(achievement)}>
                      <IconComponent size={28} />
                    </div>
                    
                    <div className="achievement-tier-label">
                      {achievement.tier.charAt(0).toUpperCase() + achievement.tier.slice(1)}
                    </div>

                    <div className="achievement-checkmark">
                      ✓
                    </div>
                  </div>
                )
              })}
              
              {/* Render tooltip outside of grid using portal */}
              {hoveredBadge && tooltipPosition && (() => {
                const achievement = unlockedAchievements.find(a => a.achievement.id === hoveredBadge)?.achievement
                return achievement && createPortal(
                  <div 
                    className="achievement-tooltip"
                    style={{
                      top: `${tooltipPosition.top}px`,
                      left: `${tooltipPosition.left}px`,
                      transform: tooltipPosition.showBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)'
                    }}
                  >
                    <div className="tooltip-header">
                      <strong>{achievement.name}</strong>
                      <span className={`tooltip-tier-badge ${achievement.tier}`}>
                        {achievement.tier.toUpperCase()}
                      </span>
                    </div>
                    <p className="tooltip-description">{achievement.description}</p>
                    <div className="tooltip-completed">
                      🎉 Completed!
                    </div>
                  </div>,
                  document.body
                )
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
