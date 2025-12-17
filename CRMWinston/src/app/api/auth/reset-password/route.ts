import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get Strapi URL from environment variable
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL?.replace('/api', '') || 'http://localhost:1337';
    
    // Forward the request to Strapi
    const response = await fetch(`${strapiUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Reset password proxy error:', error);
    return NextResponse.json(
      { error: { message: 'Failed to connect to authentication server' } },
      { status: 500 }
    );
  }
}

