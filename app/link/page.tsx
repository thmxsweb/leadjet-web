import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import Approve from './approve';

export default async function LinkPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/link?code=${code ?? ''}`)}`);
  }
  return (
    <div className="auth-wrap">
      <Approve code={code ?? ''} email={session.user.email ?? ''} />
    </div>
  );
}
