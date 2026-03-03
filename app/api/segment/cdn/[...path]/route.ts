import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const upstreamUrl = `https://cdn.segment.com/${path.join('/')}`;

  const response = await fetch(upstreamUrl, {
    headers: { 'User-Agent': request.headers.get('user-agent') || '' },
  });

  const body = await response.arrayBuffer();

  return new NextResponse(body, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') || 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
