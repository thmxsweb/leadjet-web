import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import Settings from '@/components/Settings';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  return <Settings email={session.user.email ?? ''} />;
}
