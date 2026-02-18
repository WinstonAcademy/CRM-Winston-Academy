import { NextResponse } from 'next/server';

const demoAgencies = [
    {
        agencyName: "Global Education Partners",
        agencyEmail: "info@globaledupartners.com",
        country: "United Kingdom",
        registrationNumber: "GEP-2024-001",
        address: "45 Oxford Street, London, W1D 2DZ",
        website: "https://globaledupartners.com",
        primaryContactName: "James Harrison",
        primaryContactEmail: "james@globaledupartners.com",
        primaryContactPhone: "+44 20 7946 0958",
        contractStartDate: "2024-01-15",
        contractEndDate: "2025-12-31",
        commissionRate: 12.5,
        commissionType: "percentage",
        paymentTerms: "Net 30 days after enrollment confirmation",
        status: "Active",
        notes: "Premium partner since 2024. Focuses on UK and EU markets.",
        publishedAt: new Date().toISOString(),
    },
    {
        agencyName: "Asia Pacific Student Services",
        agencyEmail: "contact@apss.edu.au",
        country: "Australia",
        registrationNumber: "APSS-2023-047",
        address: "120 Collins Street, Melbourne VIC 3000",
        website: "https://apss.edu.au",
        primaryContactName: "Sarah Chen",
        primaryContactEmail: "sarah.chen@apss.edu.au",
        primaryContactPhone: "+61 3 9654 2100",
        contractStartDate: "2023-06-01",
        contractEndDate: "2026-05-31",
        commissionRate: 15.0,
        commissionType: "percentage",
        paymentTerms: "Quarterly payments, due within 45 days",
        status: "Active",
        notes: "Strong network across Southeast Asia. Top performer in Q3 2025.",
        publishedAt: new Date().toISOString(),
    },
    {
        agencyName: "EduBridge International",
        agencyEmail: "admissions@edubridge.in",
        country: "India",
        registrationNumber: "EBI-2022-189",
        address: "Connaught Place, Block A, New Delhi 110001",
        website: "https://edubridge.in",
        primaryContactName: "Raj Patel",
        primaryContactEmail: "raj.patel@edubridge.in",
        primaryContactPhone: "+91 11 2334 5678",
        contractStartDate: "2022-09-01",
        contractEndDate: "2025-08-31",
        commissionRate: 10.0,
        commissionType: "percentage",
        paymentTerms: "Monthly invoicing, Net 30",
        status: "Active",
        notes: "Largest agency partner in South Asia. Handles 200+ students annually.",
        publishedAt: new Date().toISOString(),
    },
    {
        agencyName: "Nordic Study Abroad",
        agencyEmail: "hello@nordicstudy.se",
        country: "Sweden",
        registrationNumber: "NSA-2024-033",
        address: "Kungsgatan 12, 111 35 Stockholm",
        website: "https://nordicstudy.se",
        primaryContactName: "Erik Lindqvist",
        primaryContactEmail: "erik@nordicstudy.se",
        primaryContactPhone: "+46 8 505 830 00",
        contractStartDate: "2024-03-01",
        contractEndDate: "2025-02-28",
        commissionRate: 5000,
        commissionType: "flat",
        paymentTerms: "Flat fee per enrolled student, paid upon enrollment",
        status: "Inactive",
        notes: "Contract under review for renewal. Pending updated terms.",
        publishedAt: new Date().toISOString(),
    },
    {
        agencyName: "AfriLearn Consultants",
        agencyEmail: "ops@afrilearn.ng",
        country: "Nigeria",
        registrationNumber: "ALC-2023-112",
        address: "Victoria Island, Lagos, Nigeria",
        website: "https://afrilearn.ng",
        primaryContactName: "Ngozi Okafor",
        primaryContactEmail: "ngozi@afrilearn.ng",
        primaryContactPhone: "+234 1 271 0000",
        contractStartDate: "2023-11-01",
        contractEndDate: "2024-10-31",
        commissionRate: 8.0,
        commissionType: "tiered",
        paymentTerms: "Tiered: 8% for first 50 students, 10% for 51-100, 12% beyond",
        status: "Suspended",
        notes: "Contract expired. Awaiting compliance documentation for renewal.",
        publishedAt: new Date().toISOString(),
    },
];

export async function GET() {
    const results: any[] = [];

    for (const agency of demoAgencies) {
        try {
            const res = await fetch('http://localhost:1337/api/agencies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: agency }),
            });

            const data = await res.json();
            if (res.ok) {
                results.push({ status: 'ok', name: agency.agencyName });
            } else {
                results.push({ status: 'error', name: agency.agencyName, error: data?.error?.message || data });
            }
        } catch (err: any) {
            results.push({ status: 'error', name: agency.agencyName, error: err.message });
        }
    }

    return NextResponse.json({ results });
}
