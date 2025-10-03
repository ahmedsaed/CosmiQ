# Phase 1 Testing Guide

## Prerequisites

Before testing, ensure you have:
1. Node.js 18+ installed
2. npm installed
3. Dependencies installed: `cd app && npm install` (already done ✅)

## Quick Start Options

### Option 1: UI Only (Fastest - for testing Phase 1 UI components)
```bash
make run
# or
make ui
# or
cd app && npm run dev
```
Then open: http://localhost:3000

**Note**: This runs just the Next.js UI without the backend. You'll see the demo page with all components, but API calls won't work.

### Option 2: Full Stack (Complete testing with backend)
```bash
make start-all
```

This starts:
- 📊 SurrealDB (database) on port 8000
- 🔗 API backend on port 5055
- ⚙️ Background worker
- 🌐 Next.js UI on port 3000

Then open:
- **UI**: http://localhost:3000
- **API Docs**: http://localhost:5055/docs

## What to Test in Phase 1

### ✅ Visual & Theme Testing
1. **Dark Space Theme**
   - Background should be deep space blue/black (#0a0e1a)
   - Accent colors: cyan (#00d9ff) and purple (#a855f7)
   - Smooth animations and transitions
   - Glass card effects with backdrop blur

2. **Typography**
   - Inter font throughout
   - Proper font sizes and hierarchy
   - Good contrast on dark background

### ✅ Component Testing

Navigate to http://localhost:3000 and test:

1. **Buttons**
   - 4 variants: Primary (cyan), Secondary (purple), Outline, Ghost
   - 3 sizes: Small, Medium, Large
   - Loading states
   - Hover effects with glow

2. **Cards**
   - Hover lift effect
   - Border glow on hover
   - Glass morphism effect

3. **Inputs & Forms**
   - Focus states with cyan glow
   - Error states (red border)
   - Icons in inputs
   - Textarea auto-grow

4. **Select Dropdown**
   - Opens/closes properly
   - Options selectable
   - Proper styling

5. **Badges**
   - 6 color variants
   - Proper sizing

6. **Dialog/Modal**
   - Click "Open Dialog" button
   - Modal opens with backdrop
   - Can close with X or Cancel
   - Focus trap works

7. **Toast Notifications**
   - Click "Show Toast" button
   - Toast appears top-right
   - Auto-dismisses after 3 seconds
   - Can manually dismiss
   - Try different types (success, error, warning, info)

8. **Loading States**
   - Spinner component
   - Skeleton loaders
   - Loading overlay

9. **Empty State**
   - Icon, title, description display correctly
   - Action button works

10. **Header/Navigation**
    - Logo with glow effect
    - Navigation links (Dashboard, Settings)
    - Active state highlighting
    - Settings icon button

### ✅ Responsive Testing
- Resize browser window
- Test on mobile viewport (DevTools)
- Ensure components adapt properly

### ✅ API Client Testing (with backend running)

If running full stack (`make start-all`):

1. **Check API Connection**
   - Open browser console (F12)
   - API client should be initialized
   - No CORS errors

2. **Test Auth**
   - If you have `OPEN_NOTEBOOK_PASSWORD` set in `.env`, requests should include Bearer token
   - Check Network tab for Authorization header

## Stopping Services

### Stop UI Only
Press `Ctrl+C` in the terminal

### Stop All Services
```bash
make stop-all
```

## Check Service Status
```bash
make status
```

## Troubleshooting

### Port 3000 already in use
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9
# Or use a different port
cd app && npm run dev -- -p 3001
```

### API not connecting
1. Check if API is running: `curl http://localhost:5055/health`
2. Check `.env` file for correct `OPEN_NOTEBOOK_PASSWORD`
3. Check browser console for CORS errors

### Styling looks broken
1. Ensure Tailwind CSS compiled: Check for `app/.next` directory
2. Clear Next.js cache: `rm -rf app/.next`
3. Restart dev server

### Components not rendering
1. Check browser console for errors
2. Ensure all dependencies installed: `cd app && npm install`
3. Check TypeScript errors: `cd app && npm run build`

## Expected Behavior

### ✅ Success Indicators
- Dark space theme loads with proper colors
- All components on demo page render correctly
- Smooth animations and hover effects
- No console errors
- Toast notifications work
- Dialogs open and close
- Buttons respond to clicks

### ❌ Known Limitations (Phase 1)
- No real data (using demo content)
- Dashboard page not implemented yet
- Notebook detail page not implemented yet
- Settings page not implemented yet
- API endpoints return mock data or errors (expected)

## Next Steps After Testing

Once you've verified Phase 1 works correctly:
1. Report any issues or desired changes
2. Approve moving to Phase 2 (Dashboard implementation)
3. Or request modifications to existing components

## Useful Commands

```bash
# Install dependencies
make ui-install

# Run UI only
make ui

# Run full stack
make start-all

# Stop all services
make stop-all

# Check status
make status

# Build production bundle (optional)
make ui-build
```

---

**Ready to test?** Run `make start-all` for the complete experience! 🚀
