# Deployment Fixes for Render

## Issues Fixed

### 1. **Express 5 Wildcard Route Compatibility** ✅
- **Problem**: Express 5 uses path-to-regexp v6+ which doesn't support `*` or `(.*)` wildcards
- **Fix**: Changed catch-all route from `app.get('*', ...)` to `app.get('/:any*', ...)`
- **File**: `server/src/index.ts` line 433

### 2. **CORS Configuration for Production** ✅
- **Problem**: Hardcoded `localhost:5173` would block production frontend requests
- **Fix**: Dynamic origin checking based on `NODE_ENV`
  - Development: Allows `localhost:5173` and `localhost:5000`
  - Production: Uses `FRONTEND_URL` environment variable (fallback: `your-app.onrender.com`)
- **File**: `server/src/index.ts` lines 27-42
- **Required Env Var**: `FRONTEND_URL` (e.g., `https://your-frontend.onrender.com`)

### 3. **Session Cookie Security** ✅
- **Problem**: Cookie `secure` flag was hardcoded to `false`
- **Fix**: 
  - `secure: true` in production (HTTPS required)
  - `sameSite: 'none'` in production (for cross-origin cookies)
  - `sameSite: 'lax'` in development
- **File**: `server/src/index.ts` lines 55-57

### 4. **Hardcoded API URLs in Frontend** ✅
- **Problem**: `AuthContext` used `http://localhost:5000/api/auth/me`
- **Fix**: Changed to relative path `/api/auth/me`
- **File**: `src/contexts/AuthContext.tsx` line 32

### 5. **Missing TypeScript Dependencies** ✅
- **Problem**: Missing `@types/bcryptjs` would cause TypeScript compilation errors
- **Fix**: Added to `devDependencies`
- **File**: `server/package.json`

### 6. **Server Dependencies Not Installed During Build** ✅
- **Problem**: Deployment builds frontend but skips server dependency installation
- **Fix**: Modified build script to run `npm install --prefix server` before compilation
- **File**: `package.json` line 8

## Environment Variables Required on Render

Add these to your Render dashboard:

```bash
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
SESSION_SECRET=your-super-secret-session-key-min-32-chars
FRONTEND_URL=https://your-frontend.onrender.com
PORT=5000  # Render sets this automatically
```

## Deployment Checklist

- [x] CORS allows production frontend URL
- [x] Cookie security enabled for HTTPS
- [x] All hardcoded localhost URLs removed
- [x] Express 5 route syntax updated
- [x] TypeScript dependencies complete
- [x] Build script includes server compilation
- [ ] Environment variables configured on Render
- [ ] MongoDB Atlas cluster configured (if using MongoDB)

## Known Considerations

1. **Uploads Persistence**: ✅ Files are now stored in **MongoDB GridFS**, ensuring they persist across Render restarts/deployments. The previous ephemeral filesystem issue is resolved.

2. **Session Store**: Uses `connect-mongo` with MongoStore, which is persistent across server restarts.

3. **Static File Serving**: In production, Express serves the built React app from `dist/` directory.

## Testing Locally in Production Mode

```bash
# Build everything
npm run build

# Set environment to production
export NODE_ENV=production  # Linux/Mac
$env:NODE_ENV="production"  # Windows PowerShell

# Start server
npm start
```
