import { CampaignFlow } from "@/components/campaign/CampaignFlow";
import {
  getPublicCampaignEntries,
  getPublicRaffleWinners,
} from "@/lib/campaign-db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [entries, raffleWinners] = await Promise.all([
    getPublicCampaignEntries(),
    getPublicRaffleWinners(),
  ]);

  return (
    <CampaignFlow
      initialEntries={entries}
      initialRaffleWinners={raffleWinners}
    />
  );
}
