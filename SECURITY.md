# Security Testing Guide

This document outlines the comprehensive security testing framework for the Kanban application.

## 🔒 Security Test Coverage

### Token and Credential Protection
- **Private Token Detection**: Scans for hardcoded API keys, JWT tokens, database URLs, and private keys
- **Environment Variable Security**: Validates proper VITE_ naming conventions and detects suspicious public variables
- **Console Log Protection**: Ensures no sensitive data is accidentally logged
- **Authentication Patterns**: Verifies secure authentication implementation
- **Communication Security**: Checks for HTTPS usage and secure communication patterns

### Data Protection
- **Error Message Security**: Ensures error messages don't leak sensitive user data
- **Input Sanitization**: Validates handling of malicious input patterns
- **LocalStorage Security**: Checks for sensitive data in browser storage

## 🚨 Security Patterns Detected

### API Keys and Tokens
- Stripe keys (live/test/publishable/restricted)
- AWS Access Keys
- JWT tokens
- Slack tokens
- Google OAuth2 tokens
- Google API keys
- Generic secret keys

### Database Credentials
- PostgreSQL connection strings
- MySQL connection strings
- MongoDB connection strings

### Supabase Security
- Supabase JWT tokens
- Supabase project tokens
- Service role keys

### Private Keys
- RSA private keys
- EC private keys
- OpenSSH private keys
- Generic private key formats

### Environment Variables
- Hardcoded secrets in code
- Exposed private keys
- API secrets
- Database URLs

## 🛡️ Security Best Practices

### Environment Variables
```bash
# ✅ Good - Public variables with VITE_ prefix
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_API_ENDPOINT=https://api.yourapp.com

# ❌ Bad - Private keys exposed to client
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJ... # This will be exposed!
VITE_SECRET_KEY=secret123 # Never do this!

# ✅ Good - Server-side only (no VITE_ prefix)
SUPABASE_SERVICE_ROLE_KEY=eyJ... # Only available on server
DATABASE_URL=postgresql://... # Only available on server
```

### Code Security
```typescript
// ✅ Good - Using environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// ❌ Bad - Hardcoded secrets
const API_KEY = 'sk_live_abcd1234...' // Never hardcode secrets!
const JWT_SECRET = 'my-secret-key' // This will be in your bundle!
```

### Error Handling
```typescript
// ✅ Good - Safe error messages
catch (error) {
  console.error('Authentication failed')
  throw new Error('Login failed. Please try again.')
}

// ❌ Bad - Leaking sensitive data
catch (error) {
  console.error('Failed for user:', user.email, 'with token:', user.apiKey)
  throw new Error(`Database error: ${connectionString}`)
}
```

## 🧪 Running Security Tests

### Basic Security Test
```bash
npm run test:security
```

### All Security Checks
```bash
# Run all security tests
npm run test:security

# Run performance tests (includes security monitoring)
npm run test:performance

# Run all tests
npm test
```

## 📋 Security Checklist

### Before Deployment
- [ ] All security tests passing
- [ ] No hardcoded secrets in source code
- [ ] Environment variables properly configured
- [ ] `.env` files added to `.gitignore`
- [ ] No sensitive data in localStorage
- [ ] HTTPS enforced for external APIs
- [ ] Error messages sanitized
- [ ] Input validation implemented

### Environment Setup
- [ ] `.env.example` file created with placeholder values
- [ ] Production environment variables configured
- [ ] Development environment isolated
- [ ] API keys rotated regularly
- [ ] Database credentials secured

### Code Review
- [ ] No secrets in commit history
- [ ] Environment variable naming conventions followed
- [ ] Authentication patterns secure
- [ ] Error handling doesn't leak data
- [ ] Input sanitization implemented

## 🚨 Security Alerts

The security test will fail and show detailed alerts if:

1. **Hardcoded Secrets Detected**
   ```
   🚨 SECURITY ALERT: Potential credentials detected!
   
   📁 File: /src/components/Auth.tsx
      ⚠️  Line 15: JWT token pattern
         Match: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **Suspicious Environment Variables**
   ```
   Suspicious public environment variables detected:
     - VITE_SECRET_KEY
     - VITE_PRIVATE_TOKEN
   These variables will be exposed to the client!
   ```

3. **Unsafe Practices**
   ```
   Error message contains sensitive data!
   Suspicious data in localStorage[api_key]
   ```

## 🔧 Fixing Security Issues

### Move Secrets to Environment Variables
```typescript
// Before (❌ Insecure)
const API_KEY = 'sk_live_1234567890abcdef'

// After (✅ Secure)
const API_KEY = import.meta.env.VITE_API_KEY
```

### Secure Error Handling
```typescript
// Before (❌ Leaks data)
catch (error) {
  throw new Error(`Failed to authenticate user ${user.email} with key ${apiKey}`)
}

// After (✅ Secure)
catch (error) {
  console.error('Authentication failed:', error.message)
  throw new Error('Authentication failed. Please try again.')
}
```

### Clean LocalStorage
```typescript
// Before (❌ Sensitive data)
localStorage.setItem('api_key', user.apiKey)
localStorage.setItem('password', user.password)

// After (✅ Safe data only)
localStorage.setItem('user_preferences', JSON.stringify({
  theme: user.theme,
  language: user.language
}))
```

## 📚 Additional Resources

- [OWASP Security Guidelines](https://owasp.org/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/managing-user-data)
- [React Security Best Practices](https://reactjs.org/docs/dom-elements.html#security)

## 🔄 Continuous Security

This security test suite runs automatically to:
- ✅ Detect new security vulnerabilities
- ✅ Prevent accidental credential exposure
- ✅ Validate secure coding practices
- ✅ Monitor for security regressions
- ✅ Ensure compliance with security standards

Keep your security tests updated and run them regularly as part of your CI/CD pipeline!