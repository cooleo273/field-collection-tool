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