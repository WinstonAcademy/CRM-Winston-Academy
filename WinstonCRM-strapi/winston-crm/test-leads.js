// Test script to add sample leads to Strapi
const STRAPI_URL = 'http://localhost:1337';

const sampleLeads = [
  {
    Name: "John Smith",
    Email: "john.smith@email.com",
    Phone: "447911123456",
    LeadStatus: "New Lead",
    Courses: "Computer Science",
    Source: "Website",
    Country: "United Kingdom",
    Date: "2024-01-15",
    Notes: "Interested in Computer Science program"
  },
  {
    Name: "Sarah Johnson",
    Email: "sarah.johnson@email.com",
    Phone: "447911234567",
    LeadStatus: "Contacted",
    Courses: "Business Administration",
    Source: "Referral",
    Country: "United States",
    Date: "2024-01-14",
    Notes: "Follow up scheduled for next week"
  },
  {
    Name: "Michael Brown",
    Email: "michael.brown@email.com",
    Phone: "447911345678",
    LeadStatus: "Potential Student",
    Courses: "Engineering",
    Source: "Social Media",
    Country: "Canada",
    Date: "2024-01-13",
    Notes: "Very interested, needs financial information"
  },
  {
    Name: "Emily Davis",
    Email: "emily.davis@email.com",
    Phone: "447911456789",
    LeadStatus: "Student ",
    Courses: "Psychology",
    Source: "Website",
    Country: "United Kingdom",
    Date: "2024-01-12",
    Notes: "Enrolled in Psychology program"
  },
  {
    Name: "David Wilson",
    Email: "david.wilson@email.com",
    Phone: "447911567890",
    LeadStatus: "Not Interested",
    Courses: "Medicine",
    Source: "Email Campaign",
    Country: "Australia",
    Date: "2024-01-11",
    Notes: "Decided to pursue different field"
  }
];

async function addTestLeads() {
  console.log('Adding test leads to Strapi...');
  
  for (const lead of sampleLeads) {
    try {
      const response = await fetch(`${STRAPI_URL}/api/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: lead }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Added lead: ${lead.Name} (ID: ${result.data.id})`);
      } else {
        console.error(`❌ Failed to add lead: ${lead.Name}`);
      }
    } catch (error) {
      console.error(`❌ Error adding lead ${lead.Name}:`, error);
    }
  }
  
  console.log('Finished adding test leads');
}

// Run the script
addTestLeads();
