# Performance Testing & Memory Leak Detection

This directory contains comprehensive tests to detect data leaks and infinite loops in the Kanban application.

## Test Overview

### 🔍 What We Test

#### **Infinite Loop Detection**
- **Re-render Loops**: Monitors component render counts to detect excessive re-rendering
- **State Update Loops**: Checks for infinite state update cycles
- **Event Loop Blocking**: Ensures rapid updates don't block the main thread
- **Console Error Monitoring**: Watches for React warnings about update depth

#### **Memory Leak Detection**
- **Component Lifecycle**: Mount/unmount cycles to check for memory retention
- **Event Listener Cleanup**: Verifies proper cleanup of DOM event listeners
- **Timer Cleanup**: Ensures setTimeout/setInterval are properly cleared
- **Memory Growth Tracking**: Monitors JavaScript heap usage over time

#### **Performance Regression**
- **Render Performance**: Tracks render times and frequencies
- **Update Batching**: Ensures state updates are properly batched
- **Concurrent Operations**: Tests handling of simultaneous operations
- **Recovery Testing**: Validates graceful error recovery

## Running Tests

### Basic Performance Test
```bash
npm run test:performance
```

### Continuous Monitoring
```bash
npm run monitor:performance
```
This runs tests every 30 seconds and alerts on performance degradation.

### Manual Test Run
```bash
node scripts/performance-monitor.mjs test
```

## Test Results Interpretation

### ✅ Passing Criteria
- **Render Count**: < 10 renders for normal operations
- **Update Performance**: < 1 second for 20 rapid updates
- **Memory Stability**: No memory growth > 50% during operations
- **Error-Free**: No console errors related to infinite loops

### 🚨 Failure Indicators
- `Maximum update depth exceeded` - Infinite re-render loop detected
- `Too many re-renders` - React bailout mechanism triggered
- Excessive render counts (> 50) - Performance degradation
- Memory leaks detected through multiple mount/unmount cycles

## Performance Monitor Features

### Automated Detection
- **Continuous Testing**: Runs every 30 seconds
- **Success Rate Tracking**: Monitors test pass/fail ratio
- **Alert System**: Warns when success rate drops below 90%
- **Statistics Reporting**: Provides detailed performance metrics

### Real-time Monitoring
```bash
🧪 Running performance test #1...
✅ Test passed (1/1)
📊 Statistics: 100.0% success rate (1/1)

🧪 Running performance test #2...
✅ Test passed (2/2)
📊 Statistics: 100.0% success rate (2/2)
```

## Test Implementation

### PerformanceMonitor Class
```typescript
class PerformanceMonitor {
  trackRender()           // Count component renders
  trackUpdate()           // Count state updates
  hasExcessiveRenders()   // Check render thresholds
  getStats()              // Get performance metrics
}
```

### Key Test Scenarios

1. **Normal Operation Test**
   - Renders KanbanBoard component
   - Waits for stabilization
   - Checks render count < 10

2. **Rapid Update Test**
   - Simulates 20 rapid board updates
   - Measures execution time < 1 second
   - Verifies no infinite loops

3. **Memory Leak Test**
   - Mounts/unmounts component 5 times
   - Checks for console warnings
   - Verifies proper cleanup

4. **Concurrent Update Test**
   - Simulates 10 simultaneous updates
   - Tests race condition handling
   - Ensures system stability

## Integration with Development

### Pre-commit Hook (Recommended)
Add to `.git/hooks/pre-commit`:
```bash
#!/bin/sh
npm run test:performance
```

### CI/CD Integration
```yaml
- name: Run Performance Tests
  run: npm run test:performance
```

### Development Workflow
1. Make changes to components
2. Run `npm run test:performance`
3. Check for performance regressions
4. Use `npm run monitor:performance` during development

## Troubleshooting

### Common Issues

**Test Timeouts**
- Increase timeout in test configuration
- Check for actual infinite loops in code

**Memory Leak False Positives**
- Browser dev tools may retain references
- Run tests in clean environment

**React Act Warnings**
- Ensure proper `act()` wrapping
- Avoid overlapping async operations

### Debug Mode
Run with additional logging:
```bash
DEBUG=performance npm run test:performance
```

## Configuration

### Thresholds (Adjustable)
```typescript
maxRenderThreshold: 50      // Maximum allowed renders
memoryGrowthLimit: 1.5      // 50% memory growth limit
executionTimeLimit: 1000    // 1 second for rapid updates
```

### Test Intervals
```javascript
interval: 30000  // 30 seconds between continuous tests
```

## Performance Optimization Tips

Based on test results, common optimizations:

1. **Use React.memo** for expensive components
2. **Optimize useCallback dependencies** to prevent infinite loops
3. **Implement proper cleanup** in useEffect
4. **Batch state updates** for better performance
5. **Use refs for values** that don't need re-renders

## Alerts and Notifications

The monitor will alert on:
- Success rate below 90%
- Infinite loop detection
- Memory leak patterns
- Performance degradation trends

This testing system ensures your Kanban application remains performant and free of memory leaks throughout development.