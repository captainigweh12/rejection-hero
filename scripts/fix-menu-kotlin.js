#!/usr/bin/env node

/**
 * Fix Kotlin compilation error in @react-native-menu/menu
 * Changes view.overflow = overflow to view.setOverflow(overflow)
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native-menu',
  'menu',
  'android',
  'src',
  'main',
  'java',
  'com',
  'reactnativemenu',
  'MenuViewManagerBase.kt'
);

try {
  if (!fs.existsSync(filePath)) {
    console.log('⚠️  MenuViewManagerBase.kt not found, skipping fix');
    process.exit(0);
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if already fixed
  if (content.includes('view.setOverflow(overflow)')) {
    console.log('✅ MenuViewManagerBase.kt already fixed');
    process.exit(0);
  }

  // Apply the fix
  const original = 'view.overflow = overflow';
  const fixed = 'view.setOverflow(overflow)';
  
  if (content.includes(original)) {
    content = content.replace(original, fixed);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Fixed Kotlin error in MenuViewManagerBase.kt');
  } else {
    console.log('⚠️  Could not find target line in MenuViewManagerBase.kt');
  }
} catch (error) {
  console.error('❌ Error fixing MenuViewManagerBase.kt:', error.message);
  // Don't fail the build if this script fails
  process.exit(0);
}

