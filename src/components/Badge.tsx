import { useState, useEffect, useRef } from 'react'
import { Trophy, Award, Medal, Star, Crown } from 'lucide-react'
import type { Achievement } from '../types/achievements'
import { calculateProgress } from '../utils/achievements'
import './Badge.css'

interface BadgeProps {
  achievement: Achievement
  isUnlocked: boolean
  currentProgress: number
  showTooltip?: boolean
}

const ICON_MAP = {
  trophy: Trophy,
  ribbon: Award,
  medal: Medal,
  star: Star,
  crown: Crown
}

export default function Badge({ achievement, isUnlocked, currentProgress, showTooltip = true }: BadgeProps) {
  const [showDetails, setShowDetails] = useState(false)
  const badgeRef = useRef<HTMLDivElement>(null)
  const IconComponent = ICON_MAP[achievement.icon]
  const progress = calculateProgress(currentProgress, achievement.requirement)
  const isComplete = progress >= 100

  // Handle click outside to close tooltip
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (badgeRef.current && !badgeRef.current.contains(event.target as Node)) {
        setShowDetails(false)
      }
    }

    if (showDetails) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [showDetails])

  const handleInteraction = () => {
    if (showTooltip) {
      setShowDetails(!showDetails)
    }
  }

  const handleMouseEnter = () => {
    if (showTooltip && !('ontouchstart' in window)) {
      // Only show on hover for non-touch devices
      setShowDetails(true)
    }
  }

  const handleMouseLeave = () => {
    if (showTooltip && !('ontouchstart' in window)) {
      // Only hide on hover leave for non-touch devices
      setShowDetails(false)
    }
  }

  const getBadgeStyle = () => {
    if (isUnlocked || isComplete) {
      return {
        background: `linear-gradient(135deg, ${achievement.color}20, ${achievement.color}40)`,
        border: `2px solid ${achievement.color}`,
        color: achievement.color,
        boxShadow: `0 0 20px ${achievement.color}30`
      }
    } else {
      return {
        background: 'var(--bg-tertiary)',
        border: '2px solid var(--border-color)',
        color: 'var(--text-muted)',
        opacity: 0.6
      }
    }
  }

  const getIconStyle = () => {
    if (isUnlocked || isComplete) {
      return {
        color: achievement.color,
        filter: `drop-shadow(0 0 8px ${achievement.color}50)`
      }
    } else {
      return {
        color: 'var(--text-muted)',
        opacity: 0.4
      }
    }
  }

  return (
    <div className="badge-container" ref={badgeRef}>
      <div
        className={`badge ${isUnlocked || isComplete ? 'unlocked' : 'locked'}`}
        style={getBadgeStyle()}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleInteraction}
      >
        <div className="badge-icon" style={getIconStyle()}>
          <IconComponent size={28} />
        </div>
        
        <div className="badge-tier">
          {achievement.tier.charAt(0).toUpperCase() + achievement.tier.slice(1)}
        </div>

        {!isUnlocked && !isComplete && (
          <div className="badge-progress">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${achievement.color}80, ${achievement.color})`
              }} 
            />
          </div>
        )}

        {(isUnlocked || isComplete) && (
          <div className="badge-checkmark">
            ✓
          </div>
        )}
      </div>

      {showDetails && showTooltip && (
        <div className="badge-tooltip">
          <div className="tooltip-header">
            <strong>{achievement.name}</strong>
            <span className={`tier-badge ${achievement.tier}`}>
              {achievement.tier.toUpperCase()}
            </span>
          </div>
          <p className="tooltip-description">{achievement.description}</p>
          <div className="tooltip-progress">
            {isUnlocked || isComplete ? (
              <span className="completed">🎉 Completed!</span>
            ) : (
              <span>
                Progress: {currentProgress} / {achievement.requirement} ({progress}%)
              </span>
            )}
          </div>
        </div>
      )}

</div>
  )
}