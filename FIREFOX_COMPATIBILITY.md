# Firefox Compatibility Guide

## Common Firefox Security Issues with Vite

### 1. **CORS (Cross-Origin Resource Sharing) Issues**
- **Symptoms**: Console errors about CORS policy violations
- **Solution**: Updated vite.config.ts with `cors: true`

### 2. **Content Security Policy (CSP) Restrictions**
- **Symptoms**: Scripts blocked by CSP, inline styles not working
- **Solution**: Added appropriate CSP headers in index.html

### 3. **Module Loading Issues**
- **Symptoms**: ES6 modules not loading, import/export errors
- **Solution**: Added Firefox-specific build target: `['es2015', 'firefox60']`

### 4. **WebSocket Connection Problems**
- **Symptoms**: Hot reload not working, dev server connection issues
- **Solution**: Added WebSocket polyfill and connection allowlist

### 5. **Global Variable Issues**
- **Symptoms**: `global is not defined` errors
- **Solution**: Added globalThis polyfill in index.html

## Firefox-Specific Settings to Check

### In Firefox Browser:
1. **about:config** settings:
   - `security.csp.enable` should be `true`
   - `security.mixed_content.block_active_content` should be `false` for localhost
   - `dom.webnotifications.enabled` should be `true`

2. **Developer Tools** (F12):
   - Check Console for any security-related errors
   - Look for CORS or CSP violations
   - Verify WebSocket connections in Network tab

### Common Error Messages and Solutions:

#### "Content Security Policy directive violated"
- **Cause**: Strict CSP blocking inline scripts/styles
- **Fix**: Updated CSP in index.html to allow necessary resources

#### "Mixed Content blocked"
- **Cause**: Loading HTTP resources on HTTPS page
- **Fix**: Ensured localhost-only configuration

#### "WebSocket connection failed"
- **Cause**: Firefox blocking WebSocket connections
- **Fix**: Added WebSocket connection allowlist in CSP

#### "Module not found" or import errors
- **Cause**: ES6 module support issues
- **Fix**: Added Firefox-specific build target and polyfills

## Testing Steps:

1. Open Firefox Developer Tools (F12)
2. Navigate to `http://localhost:5173`
3. Check Console tab for errors
4. Verify Network tab shows successful resource loading
5. Test hot reload by making a small change to a component

## Additional Firefox Privacy Settings:

If you have enhanced privacy settings:
- Temporarily disable Enhanced Tracking Protection for localhost
- Check if any Firefox extensions are blocking local development
- Ensure WebRTC is enabled for development features

## Troubleshooting Commands:

```bash
# Clear Firefox cache (if needed)
# Go to: Settings > Privacy & Security > Clear Data

# Reset Firefox developer settings:
# Go to: about:config > Search "devtools" > Reset modified preferences
```