import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import Account from '@/components/Account';

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  return <Account email={session.user.email ?? ''} />;
}
