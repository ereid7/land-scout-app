import { AccountView } from '@neondatabase/auth/react/ui';
import { accountViewPaths } from '@neondatabase/auth/react/ui/server';

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(accountViewPaths).map((path) => ({ path }));
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <main className="auth-page auth-page--account">
      <div className="auth-card auth-card--wide">
        <AccountView path={path} />
      </div>
    </main>
  );
}
