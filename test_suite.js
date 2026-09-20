/**
 * @file test_suite.js
 * @description Automated end-to-end integration and lifecycle verification test script.
 */

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("🧪 Starting Automated E2E Verification Suite for LabScope...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Helper to make requests with cookie jar
  class SessionClient {
    constructor() {
      this.cookies = [];
    }

    async request(path, options = {}) {
      const headers = options.headers || {};
      if (this.cookies.length > 0) {
        headers["Cookie"] = this.cookies.join("; ");
      }
      if (options.body && typeof options.body === "object" && !(options.body instanceof URLSearchParams)) {
        headers["Content-Type"] = "application/x-www-form-urlencoded";
        options.body = new URLSearchParams(options.body).toString();
      }

      const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
        redirect: "manual",
      });

      // Capture cookies
      const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
      if (setCookies && setCookies.length > 0) {
        setCookies.forEach((c) => {
          const cookiePart = c.split(";")[0];
          this.cookies = this.cookies.filter((existing) => !existing.startsWith(cookiePart.split("=")[0] + "="));
          this.cookies.push(cookiePart);
        });
      }

      return res;
    }

    async getFollow(path) {
      let res = await this.request(path, { method: "GET" });
      while (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        const nextLoc = res.headers.get("location");
        res = await this.request(nextLoc.startsWith("http") ? nextLoc.replace(BASE_URL, "") : nextLoc, { method: "GET" });
      }
      return res;
    }
  }

  try {
    // 1. Unauthenticated checks
    console.log("--- Test 1: Public & Landing Pages ---");
    const anon = new SessionClient();
    const landingRes = await anon.request("/");
    assert(landingRes.status === 200, "Landing page loads with HTTP 200");
    const landingHtml = await landingRes.text();
    assert(landingHtml.includes("LabScope"), "Landing page contains LabScope branding");

    const loginRes = await anon.request("/login");
    assert(loginRes.status === 200, "Login page loads with HTTP 200");

    const registerRes = await anon.request("/register");
    assert(registerRes.status === 200, "Register page loads with HTTP 200");

    // 2. Requester Flow
    console.log("\n--- Test 2: Requester (Student/Staff) Flow ---");
    const student = new SessionClient();
    const studentLoginRes = await student.request("/demo-login/requester");
    assert(studentLoginRes.status === 302, "Student 1-click demo login returns 302 redirect");

    const studentDash = await student.getFollow("/dashboard");
    const studentDashHtml = await studentDash.text();
    assert(studentDashHtml.includes("Aria Sharma"), "Student dashboard welcomes 'Aria Sharma'");
    assert(studentDashHtml.includes("Total Asset Units"), "Student dashboard contains KPI summary");

    // Requester RBAC restriction check
    const studentAdminPage = await student.request("/assets/new");
    assert(studentAdminPage.status === 403, "Student is correctly blocked (403 Forbidden) from accessing Admin asset creation page");

    // Browse equipment
    const studentAssets = await student.getFollow("/assets");
    const studentAssetsHtml = await studentAssets.text();
    assert(studentAssetsHtml.includes("Rigol DS1054Z"), "Equipment catalog shows seeded assets");

    // Raise an issue request for asset
    const tomorrow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    
    // Find asset ID for Rigol from HTML
    const assetIdMatch = studentAssetsHtml.match(/\/requests\/new\?assetId=([a-f0-9]{24})/);
    const assetId = assetIdMatch ? assetIdMatch[1] : null;
    assert(assetId !== null, "Found valid equipment asset ID for borrowing test");

    if (assetId) {
      // Test stock validation: try to request 999 units (more than available)
      const overReqRes = await student.request("/requests/new", {
        method: "POST",
        body: {
          assetId,
          quantity: 999,
          purpose: "Testing inventory limit exceed",
          expectedReturnDate: tomorrow,
        },
      });
      assert(overReqRes.status === 302, "Over-request returns 302 redirect");
      const overReqLoc = decodeURIComponent(overReqRes.headers.get("location") || "");
      assert(overReqLoc.includes("Cannot request 999 unit") || overReqLoc.includes("error="), "Over-request was prevented and flagged with inventory error");

      // Now make a valid request
      const validReqRes = await student.request("/requests/new", {
        method: "POST",
        body: {
          assetId,
          quantity: 1,
          purpose: "Automated Integration Test - Signal Measurement",
          expectedReturnDate: tomorrow,
        },
      });
      assert(validReqRes.status === 302, "Valid issue request submitted with 302 redirect to /requests/my");
      
      const myReqs = await student.getFollow("/requests/my");
      const myReqsHtml = await myReqs.text();
      assert(myReqsHtml.includes("Automated Integration Test - Signal Measurement"), "Submitted request appears in Student's 'My Requests' list with Pending status");
    }

    // 3. Lab In-Charge Flow
    console.log("\n--- Test 3: Lab In-Charge Lifecycle & Return Audit Flow ---");
    const incharge = new SessionClient();
    await incharge.request("/demo-login/incharge");
    const inchargeDash = await incharge.getFollow("/dashboard");
    const inchargeDashHtml = await inchargeDash.text();
    assert(inchargeDashHtml.includes("Prof. Marcus Thorne"), "Lab In-Charge session authenticated and dashboard welcomes 'Prof. Marcus Thorne'");
    const inchargeRequests = await incharge.getFollow("/requests");
    const inchargeReqsHtml = await inchargeRequests.text();
    assert(inchargeReqsHtml.includes("Automated Integration Test - Signal Measurement"), "Lab In-Charge can view the new pending requisition");

    // Extract request ID
    const pendingReqMatch = inchargeReqsHtml.match(/action="\/requests\/([a-f0-9]{24})\/approve"/);
    const newReqId = pendingReqMatch ? pendingReqMatch[1] : null;
    assert(newReqId !== null, "Found Pending Request ID for approval");

    if (newReqId) {
      // Step A: Approve
      const approveRes = await incharge.request(`/requests/${newReqId}/approve`, {
        method: "POST",
        body: { remarks: "Approved for senior project testing" },
      });
      assert(approveRes.status === 302, "In-charge successfully approved the request");

      // Step B: Issue (Dispatch)
      const issueRes = await incharge.request(`/requests/${newReqId}/issue`, {
        method: "POST",
        body: { remarks: "Dispatched with serial probe cables" },
      });
      assert(issueRes.status === 302, "In-charge successfully issued the equipment (Stock decremented)");

      // Step C: Record Return with Condition Audit (e.g. OK)
      const returnRes = await incharge.request(`/requests/${newReqId}/return`, {
        method: "POST",
        body: {
          returnCondition: "OK",
          returnNotes: "Returned in pristine working order.",
        },
      });
      assert(returnRes.status === 302, "In-charge successfully recorded return with condition audit: OK");

      const inchargeUpdated = await incharge.getFollow("/requests?status=Returned");
      const inchargeUpdatedHtml = await inchargeUpdated.text();
      assert(inchargeUpdatedHtml.includes("OK"), "Returned requisition shows condition badge: OK");
    }

    // 4. Admin Flow
    console.log("\n--- Test 4: Admin Asset CRUD & Integrity Checks ---");
    const admin = new SessionClient();
    await admin.request("/demo-login/admin");

    const newTag = `LAB-TEST-${Math.floor(1000 + Math.random() * 9000)}`;
    const createAssetRes = await admin.request("/assets/new", {
      method: "POST",
      body: {
        assetTag: newTag,
        name: "Keysight 34465A Digital Multimeter (6.5 Digit)",
        category: "Electronics & Embedded",
        labLocation: "Calibration Lab (Room 204)",
        condition: "Good",
        totalQuantity: 4,
        specifications: "Truevolt DMM technology, 6.5 digits resolution, 50,000 rdgs/s",
      },
    });
    assert(createAssetRes.status === 302, "Admin successfully registered new lab asset");

    const adminAssets = await admin.getFollow(`/assets?search=${newTag}`);
    const adminAssetsHtml = await adminAssets.text();
    assert(adminAssetsHtml.includes(newTag), "Newly registered asset appears in catalog search");

    // Extract newly created asset ID
    const newAssetIdMatch = adminAssetsHtml.match(new RegExp(`/assets/([a-f0-9]{24})/edit`));
    const createdAssetId = newAssetIdMatch ? newAssetIdMatch[1] : null;
    assert(createdAssetId !== null, "Found new asset ID for edit and delete verification");

    if (createdAssetId) {
      // Edit asset
      const editRes = await admin.request(`/assets/${createdAssetId}/edit`, {
        method: "POST",
        body: {
          name: "Keysight 34465A Digital Multimeter - Updated Calibration",
          category: "Electronics & Embedded",
          labLocation: "Calibration Lab (Room 204)",
          condition: "Fair",
          totalQuantity: 6,
          specifications: "Updated specs with fresh calibration certificates",
        },
      });
      assert(editRes.status === 302, "Admin successfully updated equipment specifications & total stock");

      // Delete asset
      const deleteRes = await admin.request(`/assets/${createdAssetId}/delete`, {
        method: "POST",
      });
      assert(deleteRes.status === 302, "Admin successfully deleted test asset from inventory");
    }

    console.log(`\n========================================`);
    console.log(`🎉 Automated Test Suite Completed!`);
    console.log(`📊 Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error("Test execution error:", err);
  }
}

runTests();
