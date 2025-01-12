import { SingleFundPage } from '@/components/pages/SingleFundPage';

export const dynamic = 'force-dynamic';

export default function Page({ params }: { params: { address: string } }) {
  return <SingleFundPage address={params.address} />;
} 