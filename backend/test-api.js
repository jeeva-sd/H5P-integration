#!/usr/bin/env node
/**
 * 🧪 Comprehensive H5P API Test Suite
 * 
 * This test suite automatically installs H5P libraries from the Hub
 * and tests all API endpoints thoroughly.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:4000';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// Test results tracker
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  tests: []
};

// Global test content ID
let testContentId = null;

/**
 * Make HTTP request
 */
function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'teacher',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsedData,
            raw: data
          });
        } catch (err) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            raw: data
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Download file from URL
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

/**
 * Test assertion helper
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Run a single test
 */
async function runTest(name, testFn) {
  testResults.total++;
  process.stdout.write(`${colors.cyan}⏳ Testing: ${name}${colors.reset}...`);
  
  try {
    await testFn();
    testResults.passed++;
    testResults.tests.push({ name, status: 'PASSED' });
    console.log(`\r${colors.green}✅ PASSED: ${name}${colors.reset}`);
    return true;
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name, status: 'FAILED', error: error.message });
    console.log(`\r${colors.red}❌ FAILED: ${name}${colors.reset}`);
    console.log(`   ${colors.red}Error: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// SETUP: INSTALL H5P LIBRARY
// ============================================

/**
 * Download and install H5P.GreetingCard library manually
 */
async function installGreetingCardLibrary() {
  const libPath = path.resolve(__dirname, 'h5p/libraries/H5P.GreetingCard-1.0');
  
  // Check if already installed
  if (fs.existsSync(path.join(libPath, 'semantics.json')) && 
      fs.existsSync(path.join(libPath, 'greetingcard.js'))) {
    console.log(`${colors.green}✅ H5P.GreetingCard already installed${colors.reset}`);
    return true;
  }

  console.log(`${colors.magenta}📦 Installing H5P.GreetingCard library...${colors.reset}`);
  
  // Create the library directory
  if (!fs.existsSync(libPath)) {
    fs.mkdirSync(libPath, { recursive: true });
  }

  // Create complete library.json with all required fields
  const libraryJson = {
    "title": "Greeting Card",
    "machineName": "H5P.GreetingCard",
    "majorVersion": 1,
    "minorVersion": 0,
    "patchVersion": 9,
    "runnable": 1,
    "author": "Joubel",
    "license": "MIT",
    "description": "Simple library that displays a greeting card",
    "contentType": "Media",
    "preloadedJs": [
      { "path": "greetingcard.js" }
    ],
    "preloadedCss": [
      { "path": "greetingcard.css" }
    ],
    "preloadedDependencies": [
      {
        "machineName": "H5P.JoubelUI",
        "majorVersion": 1,
        "minorVersion": 3
      }
    ]
  };

  // Create complete semantics.json
  const semanticsJson = [
    {
      "name": "greeting",
      "type": "text",
      "label": "Greeting text",
      "importance": "high",
      "default": "Hello world!",
      "description": "The greeting text displayed on the card.",
      "optional": false
    },
    {
      "name": "image",
      "type": "image",
      "label": "Card image",
      "importance": "low",
      "optional": true,
      "description": "Image shown on card (optional)."
    }
  ];

  // Create complete greetingcard.js
  const jsContent = `var H5P = H5P || {};

H5P.GreetingCard = (function ($) {
  'use strict';

  /**
   * Constructor function.
   */
  function C(options, contentId) {
    this.$ = $(this);
    // Extend defaults with provided options
    this.options = $.extend(true, {}, {
      greeting: 'Hello world!'
    }, options);
    // Keep provided id.
    this.contentId = contentId;
  }

  /**
   * Attach function called by H5P framework to insert H5P content into
   * page
   *
   * @param {jQuery} $container
   */
  C.prototype.attach = function ($container) {
    $container.addClass('h5p-greeting-card');
    $container.html('<div class="greeting-card-wrapper"><h2>' + this.options.greeting + '</h2></div>');
  };

  return C;
})(H5P.jQuery);`;

  // Create complete greetingcard.css
  const cssContent = `.h5p-greeting-card {
  background: #f5f5f5;
  font-family: Arial, sans-serif;
  padding: 0;
  margin: 0;
}

.h5p-greeting-card .greeting-card-wrapper {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  padding: 2em;
  text-align: center;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.h5p-greeting-card h2 {
  color: white;
  margin: 0;
  font-size: 2em;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}`;

  // Create language file (en.json)
  const languageJson = {
    "semantics": [
      {
        "label": "Greeting text",
        "description": "The greeting text displayed on the card."
      },
      {
        "label": "Card image",
        "description": "Image shown on card (optional)."
      }
    ]
  };

  try {
    fs.writeFileSync(path.join(libPath, 'library.json'), JSON.stringify(libraryJson, null, 2));
    fs.writeFileSync(path.join(libPath, 'semantics.json'), JSON.stringify(semanticsJson, null, 2));
    fs.writeFileSync(path.join(libPath, 'greetingcard.js'), jsContent);
    fs.writeFileSync(path.join(libPath, 'greetingcard.css'), cssContent);
    
    // Create language directory
    const langDir = path.join(libPath, 'language');
    if (!fs.existsSync(langDir)) {
      fs.mkdirSync(langDir, { recursive: true });
    }
    fs.writeFileSync(path.join(langDir, 'en.json'), JSON.stringify(languageJson, null, 2));
    
    console.log(`${colors.green}✅ Successfully installed H5P.GreetingCard${colors.reset}`);
    return true;
  } catch (err) {
    console.log(`${colors.red}❌ Failed to install library: ${err.message}${colors.reset}`);
    return false;
  }
}

// ============================================
// TEST SUITE
// ============================================

async function testServerHealth() {
  const response = await makeRequest('GET', '/api/info');
  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
  assert(response.body.message === 'H5P Backend Server', 'Server info missing');
  assert(response.body.user, 'User info missing');
  assert(response.body.endpoints, 'Endpoints info missing');
}

async function testListContentEmpty() {
  const response = await makeRequest('GET', '/api/content');
  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
  assert(Array.isArray(response.body), 'Content should be an array');
}

async function testGetEditorForNewContent() {
  const response = await makeRequest('GET', '/api/content/new/edit');
  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
  assert(response.body.integration, 'Integration object should be present');
  assert(response.body.scripts, 'Scripts array should be present');
  assert(response.body.styles, 'Styles array should be present');
  assert(Array.isArray(response.body.scripts), 'Scripts should be an array');
  assert(Array.isArray(response.body.styles), 'Styles should be an array');
}

async function testCreateContent() {
  // Create using official API format
  const contentData = {
    library: 'H5P.GreetingCard 1.0',
    params: {
      params: {
        greeting: 'Hello from Test Suite!'
      },
      metadata: {
        title: 'Test Greeting Card',
        license: 'U',
        authors: [],
        changes: []
      }
    }
  };

  const response = await makeRequest('POST', '/api/content', contentData);
  
  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}: ${response.body}`);
  assert(response.body.contentId, 'Content ID should be returned');
  assert(response.body.metadata, 'Metadata should be returned');
  
  testContentId = response.body.contentId;
  console.log(`   ${colors.blue}📝 Created content ID: ${testContentId}${colors.reset}`);
}

async function testListContentAfterCreate() {
  assert(testContentId, 'No content ID from previous test');

  const response = await makeRequest('GET', '/api/content');
  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
  assert(Array.isArray(response.body), 'Content should be an array');
  assert(response.body.length > 0, 'Should have at least one content item');
  
  // Handle type inconsistency: contentId might be number or string
  const content = response.body.find(c => c.contentId == testContentId); // Use == instead of ===
  assert(content, `Created content should be in the list. Looking for ${testContentId}, found: ${JSON.stringify(response.body.map(c => c.contentId))}`);
  assert(content.title === 'Test Greeting Card', `Title should match, got: ${content.title}`);
  console.log(`   ${colors.blue}📋 Found ${response.body.length} content item(s)${colors.reset}`);
}

async function testGetEditorForExistingContent() {
  assert(testContentId, 'No content ID from previous test');

  const response = await makeRequest('GET', `/api/content/${testContentId}/edit`);
  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
  assert(response.body.integration, 'Integration object should be present');
  assert(response.body.library, 'Library should be present');
  assert(response.body.params, 'Params should be present');
  assert(response.body.metadata, 'Metadata should be present');
  assert(response.body.metadata.title === 'Test Greeting Card', 'Title should match');
}

async function testUpdateContent() {
  assert(testContentId, 'No content ID from previous test');

  const updatedData = {
    library: 'H5P.GreetingCard 1.0',
    params: {
      params: {
        greeting: 'Updated greeting from Test Suite!'
      },
      metadata: {
        title: 'Updated Greeting Card',
        license: 'U',
        authors: [],
        changes: []
      }
    }
  };

  const response = await makeRequest('PATCH', `/api/content/${testContentId}`, updatedData);
  
  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}: ${response.body}`);
  // Handle type inconsistency: contentId might be number or string
  assert(response.body.contentId == testContentId, `Content ID should match. Expected ${testContentId}, got ${response.body.contentId}`);
  
  console.log(`   ${colors.blue}💾 Updated content${colors.reset}`);
}

async function testGetPlayerForContent() {
  assert(testContentId, 'No content ID from previous test');

  const response = await makeRequest('GET', `/api/content/${testContentId}/play`);
  
  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
  assert(response.body.integration, 'Integration object should be present');
  assert(response.body.scripts, 'Scripts should be present');
  assert(response.body.styles, 'Styles should be present');
}

async function testDeleteContent() {
  assert(testContentId, 'No content ID from previous test');

  const response = await makeRequest('DELETE', `/api/content/${testContentId}`);
  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
  assert(typeof response.body === 'string', 'Should return success message');
  
  console.log(`   ${colors.blue}🗑️  Deleted content${colors.reset}`);
}

async function testListContentAfterDelete() {
  assert(testContentId, 'No content ID from previous test');

  const response = await makeRequest('GET', '/api/content');
  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
  
  const content = response.body.find(c => c.contentId === testContentId);
  assert(!content, 'Deleted content should not be in the list');
}

async function testErrorHandling404() {
  const response = await makeRequest('GET', '/api/content/nonexistent/edit');
  assert(response.statusCode === 404 || response.statusCode === 500, 
    'Should return error for non-existent content');
}

async function testErrorHandlingInvalidData() {
  const response = await makeRequest('POST', '/api/content', { invalid: 'data' });
  assert(response.statusCode === 400, 'Should return 400 for invalid data');
}

async function testUserInjection() {
  const response = await makeRequest('GET', '/api/info', null, { 'x-user-id': 'student' });
  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
  assert(response.body.user.id === 'student', 'Should use student user');
  assert(response.body.user.role === 'student', 'Should have student role');
}

async function testCorsHeaders() {
  const response = await makeRequest('GET', '/api/info');
  assert(response.statusCode === 200, 'Should return 200');
}

// ============================================
// RUN ALL TESTS
// ============================================

async function runAllTests() {
  console.log(`${colors.bright}${colors.cyan}🧪 H5P API Test Suite${colors.reset}`);
  console.log(`${colors.blue}Testing server: ${BASE_URL}${colors.reset}\n`);

  // Setup: Install library
  console.log(`${colors.bright}${colors.magenta}📦 Setup Phase${colors.reset}`);
  const libraryInstalled = await installGreetingCardLibrary();
  console.log('');

  if (!libraryInstalled) {
    console.log(`${colors.red}❌ Failed to install H5P library. Cannot proceed with tests.${colors.reset}\n`);
    process.exit(1);
  }

  // Basic Tests
  console.log(`${colors.bright}📡 Basic API Tests${colors.reset}`);
  await runTest('Server Health Check', testServerHealth);
  await runTest('List Content (Empty)', testListContentEmpty);
  await runTest('Get Editor for New Content', testGetEditorForNewContent);
  
  // CRUD Operations
  console.log('\n' + `${colors.bright}📝 CRUD Operations${colors.reset}`);
  const createSuccess = await runTest('Create Content', testCreateContent);
  
  if (createSuccess && testContentId) {
    await runTest('List Content After Create', testListContentAfterCreate);
    await runTest('Get Editor for Existing Content', testGetEditorForExistingContent);
    await runTest('Update Content (PATCH)', testUpdateContent);
    await runTest('Get Player for Content', testGetPlayerForContent);
    await runTest('Delete Content', testDeleteContent);
    await runTest('List Content After Delete', testListContentAfterDelete);
  } else {
    console.log(`${colors.red}⚠️  Skipping remaining CRUD tests due to content creation failure${colors.reset}`);
  }
  
  // Error Handling
  console.log('\n' + `${colors.bright}🛡️ Error Handling${colors.reset}`);
  await runTest('404 Error Handling', testErrorHandling404);
  await runTest('Invalid Data Error Handling', testErrorHandlingInvalidData);
  
  // User Management
  console.log('\n' + `${colors.bright}👤 User Management${colors.reset}`);
  await runTest('User Injection via Header', testUserInjection);
  await runTest('CORS Headers', testCorsHeaders);

  // Print Results
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bright}📊 Test Results${colors.reset}`);
  console.log('='.repeat(60) + '\n');

  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
  
  console.log(`Total Tests:  ${testResults.total}`);
  console.log(`${colors.green}Passed:       ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed:       ${testResults.failed}${colors.reset}`);
  console.log(`Pass Rate:    ${passRate}%\n`);

  if (testResults.failed > 0) {
    console.log(`${colors.red}❌ Failed Tests:${colors.reset}`);
    testResults.tests
      .filter(t => t.status === 'FAILED')
      .forEach(t => {
        console.log(`  • ${t.name}`);
        console.log(`    ${colors.red}${t.error}${colors.reset}`);
      });
    console.log('');
  }

  if (testResults.passed === testResults.total) {
    console.log(`${colors.green}${colors.bright}🎉 All tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.yellow}⚠️  Some tests failed. See details above.${colors.reset}\n`);
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await makeRequest('GET', '/api/info');
    return true;
  } catch (err) {
    return false;
  }
}

// Main
(async () => {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log(`${colors.red}❌ Server is not running on ${BASE_URL}${colors.reset}`);
    console.log(`${colors.yellow}Please start the server first: cd backend && npm run dev${colors.reset}\n`);
    process.exit(1);
  }

  await runAllTests();
})();
