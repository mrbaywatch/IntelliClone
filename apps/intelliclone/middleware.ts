import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();
  
  // Extract subdomain (e.g., "pareto" from "pareto.intelliclone.no")
  const subdomain = hostname.split('.')[0];
  
  // Define tenant subdomains and their routes
  const tenantRoutes: Record<string, string> = {
    'pareto': '/home/pareto',
  };

  // Check if this is a tenant subdomain accessing /home
  if (tenantRoutes[subdomain] && url.pathname === '/home') {
    url.pathname = tenantRoutes[subdomain];
    return NextResponse.rewrite(url);
  }

  // For tenant subdomains, rewrite root to their dashboard
  if (tenantRoutes[subdomain] && url.pathname === '/') {
    // Let them see the landing page, they'll be redirected after login
    return NextResponse.next();
  }

  // Check user email domain for routing after auth
  // This is handled client-side in the auth callback
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/home',
    '/home/:path*',
  ],
};
