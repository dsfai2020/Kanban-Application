// localStorage debugging utility for Firefox desktop issues

export const localStorageDebug = {
  // Test basic localStorage functionality
  testBasicStorage(): boolean {
    try {
      const testKey = 'localStorage-test'
      const testValue = 'test-value-' + Date.now()
      
      // Test write
      localStorage.setItem(testKey, testValue)
      
      // Test read
      const retrieved = localStorage.getItem(testKey)
      
      // Test delete
      localStorage.removeItem(testKey)
      
      console.log('✅ localStorage basic test passed')
      return retrieved === testValue
    } catch (error) {
      console.error('❌ localStorage basic test failed:', error)
      return false
    }
  },

  // Test localStorage with complex objects (like our app state)
  testComplexStorage(): boolean {
    try {
      const testKey = 'kanban-test-complex'
      const testData = {
        boards: [
          {
            id: 'test-board',
            title: 'Test Board',
            columns: [
              {
                id: 'test-col',
                title: 'Test Column',
                cards: [
                  {
                    id: 'test-card',
                    title: 'Test Card',
                    description: 'Test Description',
                    createdAt: new Date().toISOString()
                  }
                ]
              }
            ]
          }
        ],
        activeBoard: 'test-board',
        settings: { theme: 'dark', autoSave: true }
      }
      
      // Test serialize
      const serialized = JSON.stringify(testData)
      console.log('📦 Serialized data size:', serialized.length, 'characters')
      
      // Test write
      localStorage.setItem(testKey, serialized)
      console.log('💾 Wrote to localStorage')
      
      // Test read
      const retrieved = localStorage.getItem(testKey)
      console.log('📖 Read from localStorage')
      
      // Test parse
      const parsed = JSON.parse(retrieved || '{}')
      console.log('🔍 Parsed data')
      
      // Test cleanup
      localStorage.removeItem(testKey)
      console.log('🧹 Cleaned up test data')
      
      const success = JSON.stringify(parsed) === JSON.stringify(testData)
      if (success) {
        console.log('✅ localStorage complex test passed')
      } else {
        console.error('❌ localStorage complex test failed - data mismatch')
      }
      
      return success
    } catch (error) {
      console.error('❌ localStorage complex test failed:', error)
      return false
    }
  },

  // Check localStorage quota and usage
  checkStorageQuota(): void {
    try {
      let used = 0
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length
        }
      }
      
      console.log('📊 localStorage usage:', {
        usedBytes: used,
        usedKB: Math.round(used / 1024 * 100) / 100,
        keys: Object.keys(localStorage).length,
        availableQuota: '~5-10MB (varies by browser)'
      })
    } catch (error) {
      console.error('❌ Failed to check localStorage quota:', error)
    }
  },

  // List all localStorage keys (for debugging)
  listAllKeys(): void {
    try {
      const keys = Object.keys(localStorage)
      console.log('🔑 localStorage keys:', keys)
      
      keys.forEach(key => {
        const value = localStorage.getItem(key)
        const size = value ? value.length : 0
        console.log(`  - ${key}: ${size} chars`)
        
        // Show preview of kanban data
        if (key === 'kanban-app-state' && value) {
          try {
            const parsed = JSON.parse(value)
            console.log(`    📋 Boards: ${parsed.boards?.length || 0}`)
            console.log(`    🎯 Active: ${parsed.activeBoard || 'none'}`)
            console.log(`    ⚙️ Settings: ${JSON.stringify(parsed.settings)}`)
          } catch (e) {
            console.log(`    ❌ Failed to parse kanban data:`, e)
          }
        }
      })
    } catch (error) {
      console.error('❌ Failed to list localStorage keys:', error)
    }
  },

  // Monitor localStorage changes
  monitorChanges(): void {
    const originalSetItem = localStorage.setItem
    const originalRemoveItem = localStorage.removeItem
    const originalClear = localStorage.clear
    
    localStorage.setItem = function(key: string, value: string) {
      console.log('📝 localStorage.setItem:', key, value.length, 'chars')
      return originalSetItem.call(this, key, value)
    }
    
    localStorage.removeItem = function(key: string) {
      console.log('🗑️ localStorage.removeItem:', key)
      return originalRemoveItem.call(this, key)
    }
    
    localStorage.clear = function() {
      console.log('🧹 localStorage.clear()')
      return originalClear.call(this)
    }
    
    console.log('👁️ localStorage monitoring enabled')
  },

  // Run full diagnostic
  runFullDiagnostic(): void {
    console.log('🔬 Running localStorage diagnostic...')
    console.log('🌍 User Agent:', navigator.userAgent)
    console.log('🖥️ Platform:', navigator.platform)
    console.log('📱 Touch Support:', 'ontouchstart' in window)
    
    this.testBasicStorage()
    this.testComplexStorage()
    this.checkStorageQuota()
    this.listAllKeys()
    
    // Check for Firefox-specific issues
    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox')
    if (isFirefox) {
      console.log('🦊 Firefox detected - checking common issues...')
      
      // Check private browsing
      try {
        localStorage.setItem('private-test', 'test')
        localStorage.removeItem('private-test')
        console.log('✅ Not in private browsing mode')
      } catch (e) {
        console.error('❌ Possible private browsing mode or storage disabled:', e)
      }
      
      // Check security settings
      console.log('🔒 Firefox Security Check:')
      console.log('  - Check about:config for dom.storage.enabled')
      console.log('  - Check about:config for privacy.resistFingerprinting')
      console.log('  - Check about:config for browser.privatebrowsing.autostart')
    }
    
    console.log('🔬 Diagnostic complete')
  }
}

// Auto-run diagnostic in development
if (import.meta.env.DEV) {
  // Add to window for manual testing
  if (typeof window !== 'undefined') {
    (window as any).localStorageDebug = localStorageDebug
    console.log('🛠️ localStorage debugging available via window.localStorageDebug')
  }
}