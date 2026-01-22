import { NextRequest, NextResponse } from 'next/server';

const STACK_AUTH_API = 'https://api.stack-auth.com';

async function proxyToStackAuth(request: NextRequest, method: string) {
  const url = new URL(request.url);
  const path = url.pathname;
  const searchParams = url.search;
  
  const targetUrl = `${STACK_AUTH_API}${path}${searchParams}`;
  
  // Get headers from the original request
  const headers: Record<string, string> = {};
  
  // Pass through important headers
  const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
  if (projectId) {
    headers['x-stack-project-id'] = projectId;
  }
  
  const publishableKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;
  if (publishableKey) {
    headers['x-stack-publishable-client-key'] = publishableKey;
  }
  
  // Required access type header
  headers['x-stack-access-type'] = 'client';

  // Forward cookies
  const cookies = request.headers.get('cookie');
  if (cookies) {
    headers['cookie'] = cookies;
  }
  
  // Forward content-type
  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers['content-type'] = contentType;
  }
  
  // Forward origin and referer
  const origin = request.headers.get('origin');
  if (origin) {
    headers['origin'] = origin;
  }
  
  const referer = request.headers.get('referer');
  if (referer) {
    headers['referer'] = referer;
  }

  let body: string | undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      body = await request.text();
    } catch {
      // No body
    }
  }

  try {
    const response = await fetch(targetUrl, {
      method,
      headers,
      body: body || undefined,
      redirect: 'manual', // Don't follow redirects, we want to return them
    });

    // Get response body
    const responseBody = await response.text();
    
    // Create response with same status and headers
    const responseHeaders = new Headers();
    
    // Copy relevant headers from Stack Auth response
    response.headers.forEach((value, key) => {
      // Don't copy some headers that Next.js should handle
      if (!['content-encoding', 'transfer-encoding', 'content-length'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Stack Auth proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy to Stack Auth' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyToStackAuth(request, 'GET');
}

export async function POST(request: NextRequest) {
  return proxyToStackAuth(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return proxyToStackAuth(request, 'PUT');
}

export async function DELETE(request: NextRequest) {
  return proxyToStackAuth(request, 'DELETE');
}

export async function PATCH(request: NextRequest) {
  return proxyToStackAuth(request, 'PATCH');
}
