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

export async function fetchSubmissionsByProjectId(projectId: string) {
  try {
    const response = await fetch(`/api/submissions/projectId?projectId=${projectId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch submissions by project ID");
    }
    return await response.json();
  } catch (error) {
    console.error("Error in fetchSubmissionsByProjectId:", error);
    throw error;
  }
}
export async function fetchSubmissionsByUserId(userId: string) {
  try {
    const response = await fetch(`/api/submissions/userId?userId=${userId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch submissions by user ID");
    }
    return await response.json();
  } catch (error) {
    console.error("Error in fetchSubmissionsByUserId:", error);
    throw error;
  }
}