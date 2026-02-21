import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: { message: 'Authorization header is required' } },
        { status: 401 }
      );
    }

    // Get Strapi URL from environment variable
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'https://api.crm.winstonacademy.co.uk';
    
    // Forward the request to Strapi custom change-password endpoint
    const response = await fetch(`${strapiUrl}/api/custom-auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Change password proxy error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to connect to authentication server' } },
      { status: 500 }
    );
  }
}

