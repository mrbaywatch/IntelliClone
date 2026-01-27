import { cache } from 'react';

import { createAccountsApi } from '@kit/accounts/api';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

export type UserWorkspace = Awaited<ReturnType<typeof loadUserWorkspace>>;

/**
 * @name loadUserWorkspace
 * @description
 * Load the user workspace data (simplified - no team accounts).
 */
export const loadUserWorkspace = cache(workspaceLoader);

async function workspaceLoader() {
  const client = getSupabaseServerClient();
  const api = createAccountsApi(client);

  const [workspace, user] = await Promise.all([
    api.getAccountWorkspace(),
    requireUserInServerComponent(),
  ]);

  return {
    accounts: [], // No team accounts
    workspace,
    user,
    canCreateTeamAccount: { allowed: false, reason: undefined },
  };
}
