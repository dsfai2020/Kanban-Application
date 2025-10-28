// Manual Test Script for ProfileModal Stats Update
// Run this in the browser console after opening the Kanban app

console.log('=== ProfileModal Cards Completed Stats Test ===');

// Check if achievementManager is available
if (window.achievementManager) {
  console.log('✅ AchievementManager found on window object');
  
  // Get initial stats
  const initialStats = window.achievementManager.getUserStats();
  console.log('📊 Initial stats:', {
    cardsCompleted: initialStats.totalCardsCompleted,
    completedCardIds: initialStats.completedCardIds
  });
  
  console.log('\n🧪 Testing ProfileModal stats update...');
  
  // Test 1: Move card to done
  console.log('1️⃣ Moving card-test-1 to done...');
  const unlocks1 = window.achievementManager.trackCardMovedToDone('card-test-1');
  
  const stats1 = window.achievementManager.getUserStats();
  console.log('   📈 Stats after 1 card:', {
    cardsCompleted: stats1.totalCardsCompleted,
    completedCardIds: stats1.completedCardIds,
    newUnlocks: unlocks1.length,
    unlockedAchievements: unlocks1.map(u => u.achievementId)
  });
  
  // Test 2: Move another card
  console.log('2️⃣ Moving card-test-2 to done...');
  const unlocks2 = window.achievementManager.trackCardMovedToDone('card-test-2');
  
  const stats2 = window.achievementManager.getUserStats();
  console.log('   📈 Stats after 2 cards:', {
    cardsCompleted: stats2.totalCardsCompleted,
    completedCardIds: stats2.completedCardIds,
    newUnlocks: unlocks2.length
  });
  
  // Test 3: Try duplicate (should be prevented)
  console.log('3️⃣ Trying to move card-test-1 to done again (should be prevented)...');
  const unlocks3 = window.achievementManager.trackCardMovedToDone('card-test-1');
  
  const stats3 = window.achievementManager.getUserStats();
  console.log('   📈 Stats after duplicate attempt:', {
    cardsCompleted: stats3.totalCardsCompleted,
    completedCardIds: stats3.completedCardIds,
    newUnlocks: unlocks3.length,
    duplicatePrevented: unlocks3.length === 0
  });
  
  console.log('\n✅ Achievement Manager Test Complete!');
  console.log('📋 Summary:');
  console.log(`   • Cards Completed: ${stats3.totalCardsCompleted}`);
  console.log(`   • Unique Cards: ${stats3.completedCardIds.length}`);
  console.log(`   • Duplicate Prevention: ${unlocks3.length === 0 ? 'Working' : 'Failed'}`);
  
  console.log('\n🎯 Manual Testing Steps:');
  console.log('1. Open the Profile Modal (click the user/profile icon)');
  console.log('2. Look for "Cards Completed" stat - should show current number');
  console.log('3. WITHOUT closing the modal, drag cards to the "Done" column');
  console.log('4. Watch the "Cards Completed" number update within 1-2 seconds');
  console.log('5. Try moving the same card back and forth - no double counting');
  console.log('6. Close and reopen modal - stats should persist');
  
  console.log('\n⚡ Expected Results:');
  console.log('• ProfileModal stats update in real-time (1 second polling)');
  console.log('• No need to close/reopen modal to see changes');
  console.log('• Stats persist between modal sessions');
  console.log('• No duplicate counting of same cards');
  
} else {
  console.error('❌ achievementManager not found on window object');
  console.log('🔧 Troubleshooting:');
  console.log('1. Make sure the dev server is running');
  console.log('2. Refresh the page');
  console.log('3. Check that App.tsx exposes achievementManager to window');
}