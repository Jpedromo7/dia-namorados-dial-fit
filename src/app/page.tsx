import { CampaignFlow } from "@/components/campaign/CampaignFlow";
import { getPublicCampaignEntries } from "@/lib/campaign-db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const entries = await getPublicCampaignEntries();

  return <CampaignFlow initialEntries={entries} />;
}
