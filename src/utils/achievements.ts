import type { Achievement, BadgeTier } from '../types/achievements'

const TIER_COLORS: Record<BadgeTier, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0', 
  gold: '#FFD700',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF'
}

const TIER_MULTIPLIERS: Record<BadgeTier, number> = {
  bronze: 1,
  silver: 3,
  gold: 10,
  platinum: 25,
  diamond: 50
}

// Base achievements with bronze tier requirements
const BASE_ACHIEVEMENTS = [
  {
    id: 'daily_streak',
    type: 'daily_streak' as const,
    name: 'Consistency Champion',
    description: 'Login for consecutive days',
    baseRequirement: 7,
    icon: 'crown' as const
  },
  {
    id: 'cards_completed',
    type: 'cards_completed' as const,
    name: 'Task Master',
    description: 'Complete cards',
    baseRequirement: 10,
    icon: 'trophy' as const
  },
  {
    id: 'cards_created',
    type: 'cards_created' as const,
    name: 'Idea Generator',
    description: 'Create new cards',
    baseRequirement: 15,
    icon: 'star' as const
  },
  {
    id: 'checklists_completed',
    type: 'checklists_completed' as const,
    name: 'Detail Oriented',
    description: 'Complete checklist items',
    baseRequirement: 25,
    icon: 'medal' as const
  },
  {
    id: 'boards_created',
    type: 'boards_created' as const,
    name: 'Project Pioneer',
    description: 'Create new boards',
    baseRequirement: 3,
    icon: 'ribbon' as const
  },
  {
    id: 'columns_created', 
    type: 'columns_created' as const,
    name: 'Workflow Architect',
    description: 'Create new columns',
    baseRequirement: 8,
    icon: 'medal' as const
  },
  {
    id: 'speed_demon',
    type: 'speed_demon' as const,
    name: 'Speed Demon',
    description: 'Complete 5+ cards in one day',
    baseRequirement: 1,
    icon: 'trophy' as const
  },
  {
    id: 'perfectionist',
    type: 'perfectionist' as const,
    name: 'Perfectionist',
    description: 'Complete all checklist items on cards',
    baseRequirement: 5,
    icon: 'crown' as const
  },
  {
    id: 'organizer',
    type: 'organizer' as const,
    name: 'Priority Master',
    description: 'Use different priority levels',
    baseRequirement: 4,
    icon: 'star' as const
  }
]

// Generate all achievements for all tiers
export const ALL_ACHIEVEMENTS: Achievement[] = []

BASE_ACHIEVEMENTS.forEach(base => {
  const tiers: BadgeTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond']
  
  tiers.forEach(tier => {
    const multiplier = TIER_MULTIPLIERS[tier]
    const requirement = base.baseRequirement * multiplier
    
    ALL_ACHIEVEMENTS.push({
      id: `${base.id}_${tier}`,
      type: base.type,
      name: `${base.name} - ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
      description: `${base.description} (${requirement})`,
      tier,
      requirement,
      icon: base.icon,
      color: TIER_COLORS[tier]
    })
  })
})

// Helper functions
export const getAchievementsByType = (type: string) => {
  return ALL_ACHIEVEMENTS.filter(achievement => achievement.type === type)
}

export const getAchievementById = (id: string) => {
  return ALL_ACHIEVEMENTS.find(achievement => achievement.id === id)
}

export const getTierColor = (tier: BadgeTier): string => {
  return TIER_COLORS[tier]
}

export const getNextTier = (currentTier: BadgeTier): BadgeTier | null => {
  const tiers: BadgeTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond']
  const currentIndex = tiers.indexOf(currentTier)
  return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null
}

export const calculateProgress = (current: number, requirement: number): number => {
  return Math.min(100, Math.round((current / requirement) * 100))
}