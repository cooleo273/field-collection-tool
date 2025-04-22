export const fetchCampaignCount = async (): Promise<number> => {
  const res = await fetch("/api/campaign/count");
  if (!res.ok) throw new Error("Failed to fetch user count");
  const { count } = await res.json();
  return count;
};

export const fetchCampaignById = async (id: string): Promise<any> => {
  const res = await fetch(`/api/campaign?id=${id}`);
  if (!res.ok) throw new Error("Failed to fetch campaign by ID");
  return res.json();
};

export const fetchAllCampaigns = async (): Promise<any[]> => {
  const res = await fetch(`/api/campaign`);
  if (!res.ok) throw new Error("Failed to fetch campaigns");
  return res.json();
};

export const createCampaign = async (campaign: any): Promise<any> => {
  const res = await fetch(`/api/campaign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(campaign),
  });
  if (!res.ok) throw new Error("Failed to create campaign");
  return res.json();
};

export const updateCampaign = async (id: string, campaign: any): Promise<any> => {
  const res = await fetch(`/api/campaign?id=${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(campaign),
  });
  if (!res.ok) throw new Error("Failed to update campaign");
  return res.json();
};

export const deleteCampaign = async (id: string): Promise<void> => {
  const res = await fetch(`/api/campaign?id=${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete campaign");
};