# Winston Academy CRM - Leads Management Setup

## Overview
This guide explains how to set up and use the Leads Management system in Winston Academy CRM.

## Features
- **Leads Table**: Display all leads with filtering and search capabilities
- **Lead Status Management**: Track lead progression through different stages
- **Contact Information**: Store and display lead contact details
- **Course Tracking**: Associate leads with specific courses
- **Source Attribution**: Track where leads come from
- **Country Support**: International lead management

## Prerequisites
1. **Strapi Backend**: Ensure your Strapi backend is running and accessible
2. **Database**: Make sure the leads collection is properly configured in Strapi
3. **API Permissions**: Configure proper permissions for the leads API endpoints

## Configuration

### 1. Environment Variables
Create a `.env.local` file in your project root with:

```bash
# Strapi Backend Configuration
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note**: Update the Strapi URL to match your actual backend instance.

### 2. Strapi Backend Setup
Ensure your Strapi backend has the following:

- **Leads API**: Configured with proper content types
- **User Permissions**: Set up authentication and authorization
- **CORS**: Configure CORS settings to allow frontend requests

### 3. Database Schema
The leads collection should include these fields:

```json
{
  "Name": "string (required)",
  "Email": "email (required)",
  "Phone": "biginteger",
  "LeadStatus": "enumeration",
  "Courses": "string",
  "Source": "string",
  "Country": "enumeration",
  "Date": "date",
  "Notes": "text",
  "Documents": "media (multiple)"
}
```

## Usage

### Accessing Leads
1. Navigate to the **Leads** section in the left sidebar
2. View all leads in the organized table format
3. Use search and filter options to find specific leads

### Lead Statuses
- **New Lead**: Initial contact
- **Contacted**: Follow-up initiated
- **Potential Student**: Qualified lead
- **Student**: Enrolled student
- **Not Interested**: Unqualified lead

### Adding New Leads
1. Click the **"Add New Lead"** button
2. Fill in the required information
3. Submit the form to create the lead

### Managing Existing Leads
- Click on any lead row to view/edit details
- Update lead status as they progress
- Add notes and track interactions

## API Endpoints

The system uses these Strapi API endpoints:

- `GET /api/leads` - Fetch all leads
- `GET /api/leads/:id` - Fetch specific lead
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure Strapi CORS settings allow your frontend domain
   - Check browser console for CORS-related errors

2. **API Connection Issues**
   - Verify Strapi backend is running
   - Check environment variable configuration
   - Ensure network connectivity

3. **Permission Errors**
   - Configure proper user roles in Strapi
   - Check API endpoint permissions
   - Verify authentication tokens

### Debug Steps

1. Check browser console for error messages
2. Verify API responses in Network tab
3. Test API endpoints directly (e.g., using Postman)
4. Check Strapi admin panel for configuration issues

## Development

### Adding New Features

1. **Custom Fields**: Extend the lead schema in Strapi
2. **New Statuses**: Update the LeadStatus enumeration
3. **Additional Filters**: Extend the search functionality
4. **Export Features**: Add data export capabilities

### Code Structure

```
src/
├── components/tables/
│   └── LeadsTable.tsx          # Main leads table component
├── services/
│   └── leadsService.ts         # API service layer
├── config/
│   └── api.ts                  # API configuration
└── app/(admin)/leads/
    └── page.tsx                # Leads page component
```

## Support

For additional support or questions:
1. Check the project documentation
2. Review Strapi documentation for backend issues
3. Check browser console for frontend errors
4. Verify API responses and permissions

## Updates

Keep your system updated:
1. Regularly update Strapi backend
2. Update frontend dependencies
3. Monitor for security patches
4. Test functionality after updates

