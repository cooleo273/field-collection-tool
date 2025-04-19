export const fetchCampaignCount = async (): Promise<number> => {
    const res = await fetch("/api/campaign/count");
    if (!res.ok) throw new Error("Failed to fetch user count");
    const { count } = await res.json();
    return count;
  };
  