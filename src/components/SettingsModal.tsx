import { useState } from 'react'
import { X, Settings } from 'lucide-react'
import type { AppSettings } from '../types'

interface SettingsModalProps {
  isOpen: boolean
  settings: AppSettings
  onClose: () => void
  onSave: (settings: AppSettings) => void
}

export default function SettingsModal({ isOpen, settings, onClose, onSave }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings)

  if (!isOpen) return null

  const handleSave = () => {
    onSave(localSettings)
    onClose()
  }

  const handleReset = () => {
    setLocalSettings({
      columnCardLimit: 8,
      theme: 'dark',
      autoSave: true
    })
  }

  return (
    <div className="modal-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2 className="settings-title">
            <Settings size={20} />
            Settings
          </h2>
          <button className="settings-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-section">
            <h3 className="settings-section-title">Column Behavior</h3>
            
            <div className="setting-item">
              <label htmlFor="columnCardLimit" className="setting-label">
                Cards before scrolling
              </label>
              <div className="setting-control">
                <input
                  id="columnCardLimit"
                  type="number"
                  min="3"
                  max="20"
                  value={localSettings.columnCardLimit}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    columnCardLimit: parseInt(e.target.value) || 8
                  })}
                  className="setting-input"
                />
                <span className="setting-description">
                  Number of cards shown before column becomes scrollable
                </span>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3 className="settings-section-title">Appearance</h3>
            
            <div className="setting-item">
              <label htmlFor="theme" className="setting-label">
                Theme
              </label>
              <div className="setting-control">
                <select
                  id="theme"
                  value={localSettings.theme}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    theme: e.target.value as 'dark' | 'light'
                  })}
                  className="setting-select"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3 className="settings-section-title">Data</h3>
            
            <div className="setting-item">
              <label htmlFor="autoSave" className="setting-label">
                Auto-save
              </label>
              <div className="setting-control">
                <input
                  id="autoSave"
                  type="checkbox"
                  checked={localSettings.autoSave}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    autoSave: e.target.checked
                  })}
                  className="setting-checkbox"
                />
                <span className="setting-description">
                  Automatically save changes to local storage
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button className="btn btn-secondary" onClick={handleReset}>
            Reset to Defaults
          </button>
          <div className="settings-actions">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}