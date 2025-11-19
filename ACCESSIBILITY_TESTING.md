# Accessibility Testing Guide

## Screen Reader Testing

### Windows: NVDA (Free)
1. **Download NVDA**:
   - Go to https://www.nvaccess.org/download/
   - Download and install NVDA (free, open-source)

2. **Start NVDA**:
   - Press `Ctrl + Alt + N` to start
   - Or find "NVDA" in Start menu

3. **Test Your App**:
   - Open your PhotoApp in browser
   - Use keyboard navigation:
     - `Tab` - Move between interactive elements
     - `Enter` or `Space` - Activate buttons/links
     - `Arrow keys` - Navigate within components
     - `Escape` - Close modals
   - Listen to what NVDA announces

4. **Common Issues to Check**:
   - ✅ All buttons have descriptive labels
   - ✅ Images have alt text
   - ✅ Modals announce when opened
   - ✅ Form fields have labels
   - ✅ Error messages are announced

### Windows: JAWS (Paid, Professional)
1. Download from: https://www.freedomscientific.com/products/software/jaws/
2. Similar usage to NVDA but more advanced features
3. 40-minute trial available

### macOS: VoiceOver (Built-in)
1. **Enable VoiceOver**:
   - Press `Command + F5` to toggle
   - Or: System Settings → Accessibility → VoiceOver

2. **VoiceOver Commands**:
   - `Control + Option + Right Arrow` - Next element
   - `Control + Option + Left Arrow` - Previous element
   - `Control + Option + Space` - Activate
   - `Control + Option + H` - Navigate headings

3. **Test Your App**:
   - Open PhotoApp in Safari or Chrome
   - Navigate using VoiceOver commands
   - Listen to announcements

### Browser DevTools Accessibility Checker

#### Chrome/Edge:
1. Open DevTools (`F12`)
2. Go to "Lighthouse" tab
3. Select "Accessibility"
4. Click "Analyze page load"
5. Review accessibility score and issues

#### Firefox:
1. Open DevTools (`F12`)
2. Go to "Accessibility" tab
3. Enable "Enable accessibility features"
4. Check for issues

## Manual Accessibility Checklist

### Keyboard Navigation
- [ ] Can navigate entire app with keyboard only
- [ ] Focus indicators are visible
- [ ] Tab order is logical
- [ ] No keyboard traps
- [ ] Escape closes modals

### Screen Reader
- [ ] All images have alt text
- [ ] Buttons have descriptive labels
- [ ] Form fields have labels
- [ ] Modals announce when opened
- [ ] Status messages are announced
- [ ] Headings are properly structured (h1, h2, etc.)

### Visual
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Text is readable at 200% zoom
- [ ] Focus indicators are visible
- [ ] No information conveyed by color alone

### ARIA Labels
- [ ] Interactive elements have `aria-label` or visible text
- [ ] Modals have `role="dialog"` and `aria-modal="true"`
- [ ] Buttons with icons have descriptive labels
- [ ] Form errors are associated with fields

## Quick Test Commands

### Test Keyboard Navigation
1. Open your app
2. Press `Tab` repeatedly - should move through all interactive elements
3. Press `Enter` or `Space` on buttons - should activate
4. Press `Escape` on modals - should close
5. Use arrow keys in image grid - should navigate between images

### Test Screen Reader (NVDA)
1. Start NVDA (`Ctrl + Alt + N`)
2. Open your app
3. Press `Tab` - NVDA should announce each element
4. Navigate to an image - should announce alt text
5. Open a modal - should announce "dialog" and modal title

## Automated Testing Tools

### axe DevTools (Browser Extension)
1. Install from Chrome/Edge/Firefox extension store
2. Open your app
3. Click axe icon in browser toolbar
4. Click "Scan" - it will find accessibility issues
5. Review and fix issues

### WAVE (Web Accessibility Evaluation Tool)
1. Go to https://wave.webaim.org/
2. Enter your app URL
3. Review accessibility report

## Common Issues Found in PhotoApp

### ✅ Already Fixed:
- Modal has `role="dialog"` and `aria-modal="true"`
- Buttons have `aria-label` attributes
- Images have alt text
- Search input has proper labels
- Keyboard navigation implemented

### ⚠️ Things to Verify:
- Color contrast on all text
- Focus indicators visibility
- Screen reader announcements
- Keyboard navigation flow

## Resources
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **NVDA Guide**: https://www.nvaccess.org/about-nvda/
- **VoiceOver Guide**: https://www.apple.com/accessibility/vision/
- **WebAIM**: https://webaim.org/

