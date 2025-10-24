#!/usr/bin/env node

/**
 * Continuous Performance Monitor
 * Runs performance tests continuously and alerts on issues
 */

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

class PerformanceMonitor {
  constructor() {
    this.testCount = 0
    this.passCount = 0
    this.failCount = 0
    this.isRunning = false
    this.interval = 30000 // Run tests every 30 seconds
  }

  async runTest() {
    return new Promise((resolve) => {
      console.log(`\n🧪 Running performance test #${this.testCount + 1}...`)
      
      const testProcess = spawn('npm', ['run', 'test:performance'], {
        cwd: join(__dirname, '..'),
        stdio: 'pipe'
      })

      let output = ''
      let errorOutput = ''

      testProcess.stdout.on('data', (data) => {
        output += data.toString()
      })

      testProcess.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      testProcess.on('close', (code) => {
        this.testCount++
        
        if (code === 0) {
          this.passCount++
          console.log(`✅ Test passed (${this.passCount}/${this.testCount})`)
          
          // Check for warnings in output
          if (errorOutput.includes('Maximum update depth exceeded') || 
              errorOutput.includes('Too many re-renders') ||
              errorOutput.includes('Warning')) {
            console.log('⚠️  Warning detected in test output:')
            console.log(errorOutput)
          }
          
          resolve({ success: true, output, errorOutput })
        } else {
          this.failCount++
          console.log(`❌ Test failed (${this.failCount}/${this.testCount})`)
          console.log('Error output:', errorOutput)
          console.log('Standard output:', output)
          resolve({ success: false, output, errorOutput })
        }
      })
    })
  }

  async start() {
    if (this.isRunning) {
      console.log('Monitor is already running')
      return
    }

    this.isRunning = true
    console.log('🚀 Starting continuous performance monitoring...')
    console.log(`Running tests every ${this.interval / 1000} seconds`)
    console.log('Press Ctrl+C to stop\n')

    // Run initial test
    await this.runTest()

    // Set up continuous monitoring
    const intervalId = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(intervalId)
        return
      }

      await this.runTest()

      // Display statistics
      const successRate = ((this.passCount / this.testCount) * 100).toFixed(1)
      console.log(`📊 Statistics: ${successRate}% success rate (${this.passCount}/${this.testCount})`)
      
      // Alert if success rate drops below 90%
      if (this.testCount >= 5 && successRate < 90) {
        console.log('🚨 ALERT: Performance degradation detected! Success rate below 90%')
      }
    }, this.interval)

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n⏹️  Stopping performance monitor...')
      this.isRunning = false
      clearInterval(intervalId)
      
      console.log(`\n📈 Final Statistics:`)
      console.log(`   Tests run: ${this.testCount}`)
      console.log(`   Passed: ${this.passCount}`)
      console.log(`   Failed: ${this.failCount}`)
      console.log(`   Success rate: ${((this.passCount / this.testCount) * 100).toFixed(1)}%`)
      
      process.exit(0)
    })
  }

  stop() {
    this.isRunning = false
  }
}

// CLI interface
const args = process.argv.slice(2)
const command = args[0] || 'start'

const monitor = new PerformanceMonitor()

switch (command) {
  case 'start':
    monitor.start()
    break
  case 'test':
    // Run a single test
    monitor.runTest().then(result => {
      process.exit(result.success ? 0 : 1)
    })
    break
  default:
    console.log('Usage: node performance-monitor.mjs [start|test]')
    console.log('  start: Run continuous monitoring')
    console.log('  test:  Run a single test')
    break
}