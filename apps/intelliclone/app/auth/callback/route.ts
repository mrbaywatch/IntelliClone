import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';

import { createAuthCallbackService } from '@kit/supabase/auth';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import pathsConfig from '~/config/paths.config';

// Email domain to dashboard mapping
const DOMAIN_ROUTES: Record<string, string> = {
  'pareto.no': '/home/pareto',
};

export async function GET(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  const service = createAuthCallbackService(supabase);

  const { nextPath } = await service.exchangeCodeForSession(request, {
    joinTeamPath: pathsConfig.app.joinTeam,
    redirectPath: pathsConfig.app.home,
  });

  // Check user's email domain for routing
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user?.email) {
    const emailDomain = user.email.split('@')[1]?.toLowerCase();
    
    if (emailDomain && DOMAIN_ROUTES[emailDomain]) {
      return redirect(DOMAIN_ROUTES[emailDomain]);
    }
  }

  return redirect(nextPath);
}
