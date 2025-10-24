import { useState, useRef } from 'react'
import { User, Mail, Camera, Save, X, LogOut, Edit2, Trophy } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { achievementManager } from '../utils/achievementManager'
import Badge from './Badge'
import type { UserProfile } from '../types'
import './ProfileModal.css'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { authState, updateProfile, signOut } = useAuth()
  const { user, profile, isGuest } = authState
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    bio: profile?.bio || '',
    preferences: {
      theme: profile?.preferences.theme || 'dark',
      notifications: profile?.preferences.notifications ?? true,
      autoSave: profile?.preferences.autoSave ?? true,
    },
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (name.startsWith('preferences.')) {
      const prefKey = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefKey]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        },
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }

    if (error) setError(null)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    // In a real app, you would upload to Supabase Storage here
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      // For now, we'll just store the data URL locally
      // TODO: Replace with Supabase Storage upload
      console.log('Would upload avatar:', dataUrl.substring(0, 50) + '...')
      setSuccess('Avatar updated successfully!')
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!profile) return

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const updates: Partial<UserProfile> = {
        displayName: formData.displayName.trim(),
        bio: formData.bio.trim(),
        preferences: formData.preferences,
      }

      await updateProfile(updates)
      setSuccess('Profile updated successfully!')
      setIsEditing(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      displayName: profile?.displayName || '',
      bio: profile?.bio || '',
      preferences: {
        theme: profile?.preferences.theme || 'dark',
        notifications: profile?.preferences.notifications ?? true,
        autoSave: profile?.preferences.autoSave ?? true,
      },
    })
    setIsEditing(false)
    setError(null)
    setSuccess(null)
  }

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      try {
        await signOut()
        onClose()
      } catch (error) {
        setError('Failed to sign out')
      }
    }
  }

  if (!isOpen) return null

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  // Guest user display
  if (isGuest) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="profile-modal" onClick={e => e.stopPropagation()}>
          <div className="profile-modal-header">
            <h2 className="profile-modal-title">
              <Trophy size={20} />
              Guest Profile & Achievements
            </h2>
            <button
              className="profile-modal-close"
              onClick={onClose}
              type="button"
            >
              <X size={20} />
            </button>
          </div>

          <div className="profile-modal-content">
            {/* Guest Avatar Section */}
            <div className="profile-avatar-section">
              <div className="profile-avatar">
                <div className="avatar-placeholder guest-avatar">
                  <User size={32} />
                </div>
              </div>
              <div className="profile-info-guest">
                <h3>Guest User</h3>
                <p>Your progress is saved locally</p>
              </div>
            </div>

            {/* Guest Notice */}
            <div className="guest-notice">
              <h4>🌟 Sign up to unlock more features!</h4>
              <p>Create an account to save your progress across devices and unlock exclusive achievements.</p>
            </div>

            {/* Achievement Stats Section */}
            <div className="profile-section">
              <h3 className="section-title">
                <Trophy size={18} />
                Your Achievement Stats
              </h3>
              <div className="achievement-stats">
                <div className="stat-card">
                  <div className="stat-icon">📋</div>
                  <div className="stat-info">
                    <div className="stat-number">{achievementManager.getUserStats().totalCardsCompleted}</div>
                    <div className="stat-label">Cards Completed</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✨</div>
                  <div className="stat-info">
                    <div className="stat-number">{achievementManager.getUserStats().totalCardsCreated}</div>
                    <div className="stat-label">Cards Created</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🔥</div>
                  <div className="stat-info">
                    <div className="stat-number">{achievementManager.getUserStats().currentDailyStreak}</div>
                    <div className="stat-label">Current Streak</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🏆</div>
                  <div className="stat-info">
                    <div className="stat-number">{achievementManager.getBadgeUnlocks().length}</div>
                    <div className="stat-label">Badges Earned</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Badges Grid */}
            <div className="profile-section">
              <h3 className="section-title">Achievement Badges</h3>
              <div className="badges-grid">
                {achievementManager.getAllAchievementsWithStatus().map(({ achievement, status }) => (
                  <Badge
                    key={achievement.id}
                    achievement={achievement}
                    isUnlocked={status.isUnlocked}
                    currentProgress={status.currentProgress}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Authenticated user display
  if (!user || !profile) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={e => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2 className="profile-modal-title">Profile Settings</h2>
          <button
            className="profile-modal-close"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div className="profile-modal-content">
          {/* Avatar Section */}
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {profile.avatar ? (
                <img src={profile.avatar} alt="Profile" className="avatar-image" />
              ) : (
                <div className="avatar-placeholder">
                  {getInitials(profile.displayName)}
                </div>
              )}
              <button
                className="avatar-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <Camera size={16} />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Profile Form */}
          <form className="profile-form">
            {/* Basic Information */}
            <div className="form-section">
              <h3 className="form-section-title">Basic Information</h3>
              
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <div className="input-group">
                  <Mail size={16} className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    value={user.email}
                    className="form-input with-icon"
                    disabled
                  />
                </div>
                <p className="form-help">Email cannot be changed</p>
              </div>

              <div className="form-group">
                <label htmlFor="displayName" className="form-label">
                  Display Name
                </label>
                <div className="input-group">
                  <User size={16} className="input-icon" />
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className="form-input with-icon"
                    disabled={!isEditing}
                    placeholder="Enter your display name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="bio" className="form-label">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="form-textarea"
                  disabled={!isEditing}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>
            </div>

            {/* Preferences */}
            <div className="form-section">
              <h3 className="form-section-title">Preferences</h3>
              
              <div className="form-group">
                <label htmlFor="theme" className="form-label">
                  Theme
                </label>
                <select
                  id="theme"
                  name="preferences.theme"
                  value={formData.preferences.theme}
                  onChange={handleInputChange}
                  className="form-select"
                  disabled={!isEditing}
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="preferences.notifications"
                    checked={formData.preferences.notifications}
                    onChange={handleInputChange}
                    className="checkbox"
                    disabled={!isEditing}
                  />
                  <span className="checkbox-text">Enable notifications</span>
                </label>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="preferences.autoSave"
                    checked={formData.preferences.autoSave}
                    onChange={handleInputChange}
                    className="checkbox"
                    disabled={!isEditing}
                  />
                  <span className="checkbox-text">Auto-save changes</span>
                </label>
              </div>
            </div>

            {/* Achievements & Badges */}
            <div className="form-section">
              <h3 className="form-section-title">
                <Trophy size={18} />
                Achievements & Badges
              </h3>
              <div className="achievements-section">
                <div className="achievements-stats">
                  <div className="stat-card">
                    <div className="stat-number">{achievementManager.getUserStats().totalCardsCompleted}</div>
                    <div className="stat-label">Cards Completed</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{achievementManager.getUserStats().totalCardsCreated}</div>
                    <div className="stat-label">Cards Created</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{achievementManager.getUserStats().currentDailyStreak}</div>
                    <div className="stat-label">Day Streak</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{achievementManager.getBadgeUnlocks().length}</div>
                    <div className="stat-label">Badges Earned</div>
                  </div>
                </div>

                <div className="badges-grid">
                  {achievementManager.getAllAchievementsWithStatus().map(({ achievement, status }) => (
                    <Badge
                      key={achievement.id}
                      achievement={achievement}
                      isUnlocked={status.isUnlocked}
                      currentProgress={status.currentProgress}
                    />
                  ))}
                </div>

                <div className="achievements-progress">
                  <h4>Next Goals</h4>
                  <div className="next-goals">
                    {achievementManager.getAllAchievementsWithStatus()
                      .filter(({ status }) => !status.isUnlocked && status.percentage > 0)
                      .sort((a, b) => b.status.percentage - a.status.percentage)
                      .slice(0, 3)
                      .map(({ achievement, status }) => (
                        <div key={achievement.id} className="goal-item">
                          <div className="goal-info">
                            <span className="goal-name">{achievement.name}</span>
                            <span className="goal-progress">
                              {status.currentProgress} / {achievement.requirement}
                            </span>
                          </div>
                          <div className="goal-progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ 
                                width: `${status.percentage}%`,
                                background: achievement.color
                              }}
                            />
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="form-section">
              <h3 className="form-section-title">Account Information</h3>
              <div className="account-info">
                <p><strong>Member since:</strong> {new Date(profile.createdAt).toLocaleDateString()}</p>
                <p><strong>Last updated:</strong> {new Date(profile.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {success && (
              <div className="success-message">
                {success}
              </div>
            )}

            {/* Action Buttons */}
            <div className="profile-actions">
              {isEditing ? (
                <div className="edit-actions">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="btn btn-primary"
                    disabled={isSaving}
                  >
                    <Save size={16} />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn btn-secondary"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="view-actions">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="btn btn-primary"
                  >
                    <Edit2 size={16} />
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="btn btn-danger"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}