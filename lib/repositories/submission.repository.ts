export async function getRecentSubmissions(limit: number) {
  try {
    const result = await fetch(`/api/submissions/recent?limit=${limit}`, {
      method: "GET",
    });
    const response = await result.json();
    return response;
  } catch (error) {
    console.error("Error in getRecentSubmissions:", error);
    throw error;
  }
}