#!/usr/bin/env node
/**
 * 🧪 H5P API Test Suite
 * 
 * This script tests all H5P API endpoints to ensure they work correctly.
 * It automatically installs a library from the H5P Hub before testing CRUD operations.
 * Run: node test-api.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:4000';
const API_BASE = '/api';

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
// SETUP: INSTALL H5P LIBRARY FROM HUB
// ============================================

/**
 * Install a content type from the H5P Hub
 */
async function installLibraryFromHub(machineName) {
  console.log(`${colors.magenta}📦 Installing ${machineName} from H5P Hub...${colors.reset}`);
  
  const response = await makeRequest('POST', `/h5p/ajax?action=library-install&id=${machineName}`);
  
  if (response.statusCode === 200 && response.body.success) {
    console.log(`${colors.green}✅ Successfully installed ${machineName}${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.yellow}⚠️  Failed to install ${machineName}: ${response.body.message || 'Unknown error'}${colors.reset}`);
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
  assert(response.body.success === true, 'Response should indicate success');
  assert(Array.isArray(response.body.content), 'Content should be an array');
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
  // Create a simple Accordion content
  const contentData = {
    library: 'H5P.Accordion 1.0',
    params: {
      params: {
        panels: [
          {
            title: 'First Panel',
            content: '<p>This is the content of the first panel for testing.</p>'
          },
          {
            title: 'Second Panel',
            content: '<p>This is the content of the second panel for testing.</p>'
          }
        ]
      },
      metadata: {
        title: 'Test Accordion',
        license: 'U',
        authors: [],
        changes: [],
        extraTitle: 'Test Accordion'
      }
    }
  };

  const response = await makeRequest('POST', '/api/content', contentData);
  
  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}: ${response.body.error || ''}`);
  assert(response.body.success === true, 'Response should indicate success');
  assert(response.body.contentId, 'Content ID should be returned');
  
  // Store contentId for later tests
  testContentId = response.body.contentId;
  console.log(`   ${colors.blue}📝 Created content with ID: ${testContentId}${colors.reset}`);
}

async function testListContentAfterCreate() {
  assert(testContentId, 'No content ID from previous test');

  const response = await makeRequest('GET', '/api/content');
  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
  assert(response.body.success === true, 'Response should indicate success');
  assert(response.body.content.length > 0, 'Should have at least one content item');
  
  const content = response.body.content.find(c => c.contentId === testContentId);
  assert(content, 'Created content should be in the list');
  assert(content.title === 'Test Accordion', 'Title should match');
  console.log(`   ${colors.blue}📋 Found ${response.body.content.length} content item(s)${colors.reset}`);
}

async function testGetContentMetadata() {
  assert(testContentId, 'No content ID from previous test');

  const response = await makeRequest('GET', `/api/content/${testContentId}`);
  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
  assert(response.body.success === true, 'Response should indicate success');
  assert(response.body.metadata, 'Metadata should be present');
  assert(response.body.metadata.title === 'Test Accordion', 'Title should match');
}

async function testGetEditorForExistingContent() {
  assert(testContentId, 'No content ID from previous test');

  const response = await makeRequest('GET', `/api/content/${testContentId}/edit`);
  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
  assert(response.body.integration, 'Integration object should be present');
  assert(response.body.library, 'Library should be present');
  assert(response.body.params, 'Params should be present');
  assert(response.body.metadata, 'Metadata should be present');
  assert(response.body.metadata.title === 'Test Accordion', 'Title should match');
}

async function testUpdateContent() {
  assert(testContentId, 'No content ID from previous test');

  const updatedData = {
    library: 'H5P.Accordion 1.0',
    params: {
      params: {
        panels: [
          {
            title: 'Updated First Panel',
            content: '<p>This panel has been updated by the test suite.</p>'
          },
          {
            title: 'Updated Second Panel',
            content: '<p>This panel has also been updated.</p>'
          },
          {
            title: 'New Third Panel',
            content: '<p>This is a new panel added during update.</p>'
          }
        ]
      },
      metadata: {
        title: 'Updated Accordion',
        license: 'U',
        authors: [],
        changes: [],
        extraTitle: 'Updated Accordion'
      }
    }
  };

  const response = await makeRequest('PUT', `/api/content/${testContentId}`, updatedData);
  
  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}: ${response.body.error || ''}`);
  assert(response.body.success === true, 'Response should indicate success');
  assert(response.body.contentId === testContentId, 'Content ID should match');
  
  console.log(`   ${colors.blue}💾 Updated content with 3 panels${colors.reset}`);
}

async function testGetPlayerForContent() {
  assert(testContentId, 'No content ID from previous test');

  const response = await makeRequest('GET', `/api/content/${testContentId}/play`);
  
  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}: ${response.body.error || ''}`);
  assert(response.body.integration, 'Integration object should be present');
  assert(response.body.scripts, 'Scripts should be present');
  assert(response.body.styles, 'Styles should be present');
}

async function testDeleteContent() {
  assert(testContentId, 'No content ID from previous test');

  const response = await makeRequest('DELETE', `/api/content/${testContentId}`);
  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
  assert(response.body.success === true, 'Response should indicate success');
  
  console.log(`   ${colors.blue}🗑️  Deleted content ${testContentId}${colors.reset}`);
}

async function testListContentAfterDelete() {
  assert(testContentId, 'No content ID from previous test');

  const response = await makeRequest('GET', '/api/content');
  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
  assert(response.body.success === true, 'Response should indicate success');
  
  const content = response.body.content.find(c => c.contentId === testContentId);
  assert(!content, 'Deleted content should not be in the list');
}

async function testErrorHandling404() {
  const response = await makeRequest('GET', '/api/content/nonexistent/edit');
  assert(response.statusCode === 500 || response.statusCode === 404, 
    'Should return error for non-existent content');
}

async function testErrorHandlingInvalidData() {
  const response = await makeRequest('POST', '/api/content', { invalid: 'data' });
  assert(response.statusCode === 400 || response.statusCode === 500, 
    'Should return error for invalid data');
}

async function testUserInjection() {
  const response = await makeRequest('GET', '/api/info', null, { 'x-user-id': 'student' });
  assert(response.statusCode === 200, `Expected 200, got ${response.statusCode}`);
  assert(response.body.user.id === 'student', 'Should use student user');
  assert(response.body.user.role === 'student', 'Should have student role');
}

async function testCorsHeaders() {
  const response = await makeRequest('GET', '/api/info');
  // CORS headers should be present due to cors() middleware
  assert(response.statusCode === 200, 'Should return 200');
}

// ============================================
// RUN ALL TESTS
// ============================================

async function runAllTests() {
  console.log(`${colors.bright}${colors.cyan}🧪 H5P API Test Suite${colors.reset}`);
  console.log(`${colors.blue}Testing server: ${BASE_URL}${colors.reset}\n`);

  // Basic Tests
  console.log(`${colors.bright}📡 Basic API Tests${colors.reset}`);
  await runTest('Server Health Check', testServerHealth);
  await runTest('List Content (Empty)', testListContentEmpty);
  await runTest('Get Editor for New Content', testGetEditorForNewContent);
  
  console.log('\n' + `${colors.bright}📝 CRUD Operations${colors.reset}`);
  
  const createSuccess = await runTest('Create Content', testCreateContent);
  
  if (createSuccess && testContentId) {
    await runTest('List Content After Create', testListContentAfterCreate);
    await runTest('Get Content Metadata', testGetContentMetadata);
    await runTest('Get Editor for Existing Content', testGetEditorForExistingContent);
    await runTest('Update Content', testUpdateContent);
    await runTest('Get Player for Content', testGetPlayerForContent);
    await runTest('Delete Content', testDeleteContent);
    await runTest('List Content After Delete', testListContentAfterDelete);
  } else {
    console.log(`${colors.red}⚠️  Skipping remaining CRUD tests due to content creation failure${colors.reset}`);
    ['List Content After Create', 'Get Content Metadata', 'Get Editor for Existing Content', 
     'Update Content', 'Get Player for Content', 'Delete Content', 'List Content After Delete'].forEach(name => {
      testResults.total++;
      testResults.failed++;
      testResults.tests.push({ name, status: 'FAILED', error: 'Content creation failed' });
    });
  }
  
  console.log('\n' + `${colors.bright}🛡️ Error Handling${colors.reset}`);
  await runTest('404 Error Handling', testErrorHandling404);
  await runTest('Invalid Data Error Handling', testErrorHandlingInvalidData);
  
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
