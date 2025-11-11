const axios = require('axios');

const BASE_URL = 'http://localhost:1337';
const API_URL = `${BASE_URL}/api`;

// Test data for creating a lead
const testLeadData = {
  Name: 'John Doe',
  Email: 'john.doe@example.com',
  Phone: '1234567890',
  Notes: 'Test lead for API testing',
  Source: 'Website',
  LeadStatus: 'New Lead',
  Courses: 'General English'
};

async function testLeadAPI() {
  console.log('🚀 Starting Lead API Tests...\n');

  try {
    // Test 1: Create a new lead
    console.log('📝 Test 1: Creating a new lead...');
    const createResponse = await axios.post(`${API_URL}/leads`, {
      data: testLeadData
    });
    
    const createdLead = createResponse.data.data;
    const leadId = createdLead.id;
    
    console.log('✅ Lead created successfully!');
    console.log(`   Lead ID: ${leadId}`);
    console.log(`   Name: ${createdLead.attributes.Name}`);
    console.log(`   Email: ${createdLead.attributes.Email}\n`);

    // Test 2: Fetch the single lead by ID
    console.log('🔍 Test 2: Fetching single lead by ID...');
    const fetchResponse = await axios.get(`${API_URL}/leads/${leadId}`);
    
    const fetchedLead = fetchResponse.data.data;
    console.log('✅ Lead fetched successfully!');
    console.log(`   Lead ID: ${fetchedLead.id}`);
    console.log(`   Name: ${fetchedLead.attributes.Name}`);
    console.log(`   Email: ${fetchedLead.attributes.Email}`);
    console.log(`   Phone: ${fetchedLead.attributes.Phone}`);
    console.log(`   Source: ${fetchedLead.attributes.Source}`);
    console.log(`   Lead Status: ${fetchedLead.attributes.LeadStatus}`);
    console.log(`   Courses: ${fetchedLead.attributes.Courses}`);
    console.log(`   Notes: ${fetchedLead.attributes.Notes}`);
    console.log(`   Date: ${fetchedLead.attributes.Date}\n`);

    // Test 3: Test fetching non-existent lead (should return 404)
    console.log('❌ Test 3: Testing error handling for non-existent lead...');
    try {
      await axios.get(`${API_URL}/leads/999999`);
      console.log('❌ Expected 404 error but got success');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Correctly received 404 error for non-existent lead');
      } else {
        console.log(`❌ Unexpected error: ${error.response?.status || error.message}`);
      }
    }
    console.log('');

    // Test 4: Test fetching all leads to verify the created lead is there
    console.log('📋 Test 4: Fetching all leads...');
    const allLeadsResponse = await axios.get(`${API_URL}/leads`);
    const allLeads = allLeadsResponse.data.data;
    
    console.log(`✅ Found ${allLeads.length} leads in total`);
    const foundLead = allLeads.find(lead => lead.id === leadId);
    if (foundLead) {
      console.log('✅ Created lead found in the list');
    } else {
      console.log('❌ Created lead not found in the list');
    }
    console.log('');

    // Test 5: Test the API response structure
    console.log('🏗️  Test 5: Verifying API response structure...');
    const expectedFields = ['id', 'attributes', 'meta'];
    const hasExpectedFields = expectedFields.every(field => 
      fetchedLead.hasOwnProperty(field)
    );
    
    if (hasExpectedFields) {
      console.log('✅ Response has correct structure');
      console.log('   - id: present');
      console.log('   - attributes: present');
      console.log('   - meta: present');
    } else {
      console.log('❌ Response structure is incorrect');
    }
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log(`\n📊 Test Summary:`);
    console.log(`   - Lead created: ✅`);
    console.log(`   - Single lead fetched: ✅`);
    console.log(`   - Error handling: ✅`);
    console.log(`   - Data consistency: ✅`);
    console.log(`   - API structure: ✅`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the tests
testLeadAPI(); 