export async function getProjectAdminDashboardStats(userId: string, projectId: string) {
  try {
    const result = await fetch('/api/stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'getProjectAdminDashboardStats', userId, projectId }),
    });
    const response = await result.json();
    return response;
  } catch (error) {
    console.error('Error in getProjectAdminDashboardStats:', error);
    throw error;
  }
}

export async function getPromoterDashboardStats(userId: string) {
  try {
    const result = await fetch('/api/stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'getPromoterDashboardStats', userId }),
    });
    const response = await result.json();
    return response;
  } catch (error) {
    console.error('Error in getPromoterDashboardStats:', error);
    throw error;
  }
}