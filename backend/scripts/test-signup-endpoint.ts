#!/usr/bin/env bun
/**
 * Test Sign-Up Endpoint Script
 * 
 * This script tests the sign-up endpoint directly to verify it works
 * and helps diagnose issues when app sign-up fails.
 */

async function testSignUpEndpoint() {
  const baseURL = process.env.BACKEND_URL || "https://api.rejectionhero.com";
  const testEmail = `test${Date.now()}@example.com`;
  
  console.log("🧪 Testing sign-up endpoint...\n");
  console.log(`📍 Backend URL: ${baseURL}`);
  console.log(`📧 Test email: ${testEmail}\n`);
  
  try {
    console.log("📤 Sending sign-up request...");
    
    const response = await fetch(`${baseURL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: testEmail,
        password: "TestPassword123!",
        name: "Test User",
      }),
    });
    
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch {
      console.log(`📄 Response (not JSON): ${text.substring(0, 200)}`);
      return;
    }
    
    console.log(`\n📄 Response data:`, JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log("\n✅ Sign-up successful!");
      console.log(`   User ID: ${data.user?.id}`);
      console.log(`   Email: ${data.user?.email}`);
      console.log(`   Token: ${data.token?.substring(0, 20)}...`);
      
      // Verify user was created in database
      if (process.env.DATABASE_URL) {
        console.log("\n🔍 Verifying user in database...");
        try {
          const { PrismaClient } = await import("../generated/prisma");
          const db = new PrismaClient();
          
          const user = await db.user.findUnique({
            where: { email: testEmail },
            include: { account: true, session: true },
          });
          
          if (user) {
            console.log("✅ User found in database!");
            console.log(`   ID: ${user.id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Accounts: ${user.account.length}`);
            console.log(`   Sessions: ${user.session.length}`);
          } else {
            console.log("⚠️  User not found in database!");
            console.log("   This might indicate a database connection issue");
          }
          
          await db.$disconnect();
        } catch (dbError) {
          console.log("⚠️  Could not verify in database:", dbError instanceof Error ? dbError.message : String(dbError));
        }
      }
      
    } else {
      console.log("\n❌ Sign-up failed!");
      console.log(`   Status: ${response.status}`);
      console.log(`   Error:`, data);
      
      if (data.error) {
        console.log(`   Error message: ${data.error}`);
      }
      if (data.message) {
        console.log(`   Message: ${data.message}`);
      }
    }
    
  } catch (error) {
    console.error("\n❌ Error testing sign-up endpoint:");
    console.error(`   ${error instanceof Error ? error.message : String(error)}`);
    
    if (error instanceof Error) {
      if (error.message.includes("fetch failed") || error.message.includes("network")) {
        console.error("\n⚠️  Network error!");
        console.error("   Check if backend is accessible");
        console.error(`   Test with: curl ${baseURL}/health`);
      } else if (error.message.includes("SSL") || error.message.includes("certificate")) {
        console.error("\n⚠️  SSL certificate error!");
        console.error("   Check SSL certificate configuration");
        console.error("   Test with: curl -k ${baseURL}/health");
      }
    }
  }
}

testSignUpEndpoint().catch(console.error);

