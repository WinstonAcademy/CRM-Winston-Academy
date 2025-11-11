# Sample Data - Winston CRM

## Overview
Sample data has been automatically created for testing the Winston CRM application.

## Login Credentials

### Admin User (Full Access)
- **Email:** `admin@winston.edu`
- **Password:** `Admin123!`
- **Permissions:** Full access to all modules (Leads, Students, Users, Dashboard)
- **Name:** Admin User

### Team Member - All Access
- **Email:** `sarah.johnson@winston.edu`
- **Password:** `Sarah123!`
- **Permissions:** Access to Leads, Students, and Dashboard
- **Name:** Sarah Johnson

### Team Member - Leads Only
- **Email:** `john.smith@winston.edu`
- **Password:** `John123!`
- **Permissions:** Access to Leads and Dashboard only
- **Name:** John Smith

### Team Member - Students Only
- **Email:** `emma.wilson@winston.edu`
- **Password:** `Emma123!`
- **Permissions:** Access to Students and Dashboard only
- **Name:** Emma Wilson

## Sample Leads (8 leads created)

1. **Michael Anderson** - New Lead
   - Course: General English
   - Country: United Kingdom
   - Source: Website

2. **Priya Patel** - Contacted
   - Course: Level 3 Business Management
   - Country: India
   - Source: Referral

3. **Carlos Rodriguez** - Potential Student
   - Course: Level 3 Information Technology
   - Country: Spain
   - Source: Social Media

4. **Fatima Al-Rashid** - New Lead
   - Course: Level 3 Health and Social Care
   - Country: United Arab Emirates
   - Source: Education Fair

5. **James O'Connor** - Contacted
   - Course: Level 3 Law
   - Country: Ireland
   - Source: Google Ads

6. **Li Wei** - New Lead
   - Course: General English
   - Country: China
   - Source: Agent

7. **Maria Santos** - Potential Student
   - Course: Level 3 Business Management
   - Country: Brazil
   - Source: Website

8. **Ahmed Hassan** - Not Interested
   - Course: Level 3 Information Technology
   - Country: Egypt
   - Source: Cold Call

## Sample Students (7 students created)

1. **Jennifer Thompson** (WST-2024-001)
   - Status: Active
   - Course: General English
   - Country: United Kingdom

2. **Raj Kumar** (WST-2024-002)
   - Status: Active
   - Course: Level 3 Business Management
   - Country: India

3. **Sophie Dubois** (WST-2024-003)
   - Status: Active
   - Course: Level 3 Information Technology
   - Country: France

4. **David Kim** (WST-2023-045)
   - Status: Completed
   - Course: Level 3 Business Management
   - Country: South Korea

5. **Isabella Romano** (WST-2024-004)
   - Status: Active
   - Course: Level 3 Health and Social Care
   - Country: Italy

6. **Mohammed Al-Fayed** (WST-2024-005)
   - Status: Suspended
   - Course: General English
   - Country: Saudi Arabia

7. **Ana Silva** (WST-2024-006)
   - Status: Active
   - Course: Level 3 Law
   - Country: Portugal

## How to Access

1. **Frontend:** http://localhost:3001
2. **Backend Admin (Strapi):** http://localhost:1337/admin
3. **Backend API:** http://localhost:1337

## Notes

- All leads are assigned to Sarah Johnson and John Smith
- All students are assigned to Sarah Johnson and Emma Wilson
- The sample data is only created once on first startup
- To recreate sample data, delete the `.tmp/data.db` file in the backend directory and restart

## Testing the Application

You can now:
- Log in with any of the provided credentials
- View and manage leads
- View and manage students
- Test role-based permissions (each user has different access levels)
- Test the CRM workflow from lead to student conversion

