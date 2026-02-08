# Testing Production Build Locally

## Instructions

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Check that dist folder exists**:
   ```bash
   ls dist/
   # Should show: index.html, assets/, vite.svg, login_bg.jpg
   ```

3. **Set environment to production** (Windows):
   ```powershell
   $env:NODE_ENV="production"
   $env:MONGO_URI="your-mongodb-uri"
   $env:SESSION_SECRET="test-secret-key"
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

5. **Open browser** to `http://localhost:5000`
   - You should see the React app, NOT a blank page
   - Open DevTools Console (F12) to check for errors

## Common Issues

### Blank White Screen
**Cause**: JavaScript not loading or runtime error

**Check**:
1. Open browser DevTools (F12) → Console tab
2. Look for errors (red text)
3. Check Network tab → filter by JS files
4. See if `/assets/index-*.js` returns 200 OK

### "Cannot GET /"
**Cause**: `NODE_ENV` not set to "production"

**Fix**: Make sure you set the environment variable before running `npm start`

### 404 for assets
**Cause**: `dist` folder not built or in wrong location

**Fix**: Run `npm run build` and verify `dist/` exists at project root
