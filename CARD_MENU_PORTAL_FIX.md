# Card Menu Portal Click Outside Bug Fix

## Problem Description
The card edit/delete menu buttons were not working because the `handleClickOutside` function was interfering with button clicks inside the menu portal. When users clicked the "Edit" or "Delete" buttons, the click outside handler would close the menu before the button click event could fire.

## Root Cause
The menu is rendered using React's `createPortal` to `document.body`, which places it outside the normal DOM hierarchy. The `handleClickOutside` function only checked if the click target was inside the menu button itself (`menuButtonRef.current.contains(target)`), but didn't account for clicks inside the portal-rendered menu.

## Solution
Updated the `handleClickOutside` function in `src/components/Card.tsx` to also check if the click target is inside the menu portal:

```tsx
// Before (buggy)
const handleClickOutside = (event: MouseEvent | TouchEvent) => {
  if (showMenu && menuButtonRef.current && !menuButtonRef.current.contains(event.target as Node)) {
    setShowMenu(false)
  }
}

// After (fixed)
const handleClickOutside = (event: MouseEvent | TouchEvent) => {
  const target = event.target as Node
  const isMenuButton = menuButtonRef.current && menuButtonRef.current.contains(target)
  const isMenuPortal = document.querySelector('.card-menu-portal')?.contains(target)
  
  if (showMenu && !isMenuButton && !isMenuPortal) {
    setShowMenu(false)
  }
}
```

## Key Changes
1. **Portal-aware click detection**: Now checks if clicks are inside the `.card-menu-portal` element
2. **Preserved outside click behavior**: Still closes menu when clicking outside both the button and portal
3. **No interference with button clicks**: Edit and Delete buttons now work correctly

## Testing
Created comprehensive test suite `card-menu-portal-click-outside-fix.test.tsx` that covers:
- ✅ Edit button functionality without interference
- ✅ Delete button functionality without interference  
- ✅ Menu still closes when clicking outside
- ✅ Menu doesn't close when clicking inside portal
- ✅ Rapid menu toggling works correctly
- ✅ Newly created cards work the same way

## Prevention
This test suite will catch any future regressions that could break the edit/delete menu functionality due to event handling issues.

## Files Modified
- `src/components/Card.tsx` - Fixed click outside handler
- `src/tests/card-menu-portal-click-outside-fix.test.tsx` - Added comprehensive test coverage

## Impact
- ✅ Edit modal now opens correctly when clicking "Edit"
- ✅ Delete confirmation now appears when clicking "Delete"  
- ✅ Both existing and newly created cards work consistently
- ✅ No disruption to other functionality (drag/drop, menu positioning, etc.)