import { NextRequest, NextResponse } from 'next/server';

async function proxy(request: NextRequest, path: string[]) {
  const upstreamUrl = `https://api.segment.io/v1/${path.join('/')}`;

  const body = request.method !== 'GET' ? await request.arrayBuffer() : undefined;

  const response = await fetch(upstreamUrl, {
    method: request.method,
    headers: {
      'Content-Type': request.headers.get('content-type') || 'application/json',
      'User-Agent': request.headers.get('user-agent') || '',
    },
    body,
  });

  const responseBody = await response.arrayBuffer();

  return new NextResponse(responseBody, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') || 'application/json',
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxy(request, path);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxy(request, path);
}
