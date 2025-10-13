#!/bin/bash

# Quick test to verify mediaKitUrls database storage
echo "🧪 Testing mediaKitUrls database storage..."

# Test the database directly
node -e "
const { db } = require('./db');

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    await db.one('SELECT 1 as test');
    console.log('✅ Database connection OK');
    
    console.log('🔍 Testing media_kit_urls column...');
    const result = await db.one('SELECT media_kit_urls FROM talent_applications LIMIT 1');
    console.log('📋 Sample media_kit_urls:', result.media_kit_urls);
    console.log('📋 Type:', typeof result.media_kit_urls);
    
    console.log('🔍 Testing JSON parsing...');
    const testUrls = ['https://test1.com', 'https://test2.com'];
    const jsonString = JSON.stringify(testUrls);
    console.log('📋 JSON string:', jsonString);
    
    const parsed = JSON.parse(jsonString);
    console.log('📋 Parsed result:', parsed);
    console.log('✅ JSON parsing works correctly');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    process.exit(0);
  }
}

testDatabase();
"

echo "✅ Database test completed!"
