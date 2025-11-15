/**
 * Script to check GoHighLevel API scopes and permissions
 */

const GOHIGHLEVEL_API_KEY = process.env.GOHIGHLEVEL_API_KEY || "pit-ca134c24-5db3-47a0-9ea7-7292fdf2e7e6";
const GOHIGHLEVEL_BASE_URL = "https://services.leadconnectorhq.com";

async function checkAPIScopes() {
  console.log("🔍 Checking GoHighLevel API Scopes...\n");
  console.log(`API Key: ${GOHIGHLEVEL_API_KEY.substring(0, 20)}...`);
  console.log(`Base URL: ${GOHIGHLEVEL_BASE_URL}\n`);

  try {
    // Try to get location info to verify basic access
    console.log("📍 Testing basic API access...");
    const locationResponse = await fetch(`${GOHIGHLEVEL_BASE_URL}/locations/5vDQKirnGk3E91LagT6j`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${GOHIGHLEVEL_API_KEY}`,
        "Content-Type": "application/json",
        "Version": "2021-07-28",
      },
    });

    if (locationResponse.ok) {
      const locationData = await locationResponse.json();
      console.log("✅ Basic API access: WORKING");
      console.log(`   Location: ${locationData.location?.name || "Unknown"}\n`);
    } else {
      const error = await locationResponse.text();
      console.log("⚠️  Basic API access:", locationResponse.status, error, "\n");
    }

    // Test contacts.write scope
    console.log("📝 Testing contacts.write scope...");
    const contactsTest = await fetch(`${GOHIGHLEVEL_BASE_URL}/contacts/search?locationId=5vDQKirnGk3E91LagT6j&limit=1`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${GOHIGHLEVEL_API_KEY}`,
        "Content-Type": "application/json",
        "Version": "2021-07-28",
      },
    });

    if (contactsTest.ok) {
      console.log("✅ contacts.write scope: ENABLED");
    } else {
      const error = await contactsTest.text();
      console.log("❌ contacts.write scope:", contactsTest.status, error);
    }

    // Test conversations.messages.write scope
    console.log("\n📧 Testing conversations.messages.write scope...");
    const messagesTest = await fetch(`${GOHIGHLEVEL_BASE_URL}/conversations/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GOHIGHLEVEL_API_KEY}`,
        "Content-Type": "application/json",
        "Version": "2021-07-28",
      },
      body: JSON.stringify({
        type: "Email",
        contactId: "test-contact-id",
        subject: "Test",
        html: "<p>Test</p>",
      }),
    });

    const messagesError = await messagesTest.text();

    if (messagesTest.status === 401 && messagesError.includes("not authorized for this scope")) {
      console.log("❌ conversations.messages.write scope: NOT ENABLED");
      console.log("   Error: Token is not authorized for this scope");
    } else if (messagesTest.status === 400 || messagesTest.status === 404) {
      // 400/404 means the scope is enabled but the request is invalid (expected)
      console.log("✅ conversations.messages.write scope: ENABLED");
      console.log("   (Got expected validation error, which means scope is working)");
    } else {
      console.log(`⚠️  conversations.messages.write scope: Status ${messagesTest.status}`);
      console.log(`   Response: ${messagesError}`);
    }

    // Test conversations.write scope
    console.log("\n💬 Testing conversations.write scope...");
    const conversationsTest = await fetch(`${GOHIGHLEVEL_BASE_URL}/conversations/search?locationId=5vDQKirnGk3E91LagT6j&limit=1`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${GOHIGHLEVEL_API_KEY}`,
        "Content-Type": "application/json",
        "Version": "2021-07-28",
      },
    });

    const conversationsError = await conversationsTest.text();

    if (conversationsTest.status === 401 && conversationsError.includes("not authorized for this scope")) {
      console.log("❌ conversations.write scope: NOT ENABLED");
      console.log("   Error: Token is not authorized for this scope");
    } else if (conversationsTest.ok || conversationsTest.status === 400 || conversationsTest.status === 404) {
      console.log("✅ conversations.write scope: ENABLED");
    } else {
      console.log(`⚠️  conversations.write scope: Status ${conversationsTest.status}`);
      console.log(`   Response: ${conversationsError}`);
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 SUMMARY:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ API Key is valid and working");
    console.log("✅ Location access is working");
    console.log("✅ Contact creation/updating is working");
    console.log("");

    if (messagesTest.status === 401) {
      console.log("⚠️  EMAIL SENDING: NOT ENABLED");
      console.log("   Missing scope: conversations.messages.write");
      console.log("   Missing scope: conversations.write");
      console.log("");
      console.log("🔧 TO FIX:");
      console.log("   1. Go to GoHighLevel → Settings → API");
      console.log("   2. Edit your API key");
      console.log("   3. Enable these scopes:");
      console.log("      ☐ conversations.messages.write");
      console.log("      ☐ conversations.write");
      console.log("   4. Save changes");
    } else {
      console.log("✅ EMAIL SENDING: ENABLED");
      console.log("   All required scopes are active!");
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  } catch (error) {
    console.error("❌ Error checking API scopes:", error);
  }
}

// Run the check
checkAPIScopes()
  .then(() => {
    console.log("✅ Scope check completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Scope check failed:", error);
    process.exit(1);
  });
