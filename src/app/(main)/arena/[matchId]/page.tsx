import { redirect } from 'next/navigation';

export default function ArenaRedirect({ params }: { params: { matchId: string } }) {
  redirect(`/match/${params.matchId}`);
}
