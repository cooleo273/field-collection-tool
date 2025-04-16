export async function getSubmissionById(id: string) {
  try {
    const result = await fetch('/api/submissions',{
        method: 'GET',
    })
    const response = await result.json()
    return response
  } catch (error) {
    console.error("Error in getSubmissionById:", error);
    throw error;
  }
}

export async function getSubmissionPhotosById(id: string) {
  try {
    const result = await fetch('/api/submission_photos',{
        method: 'GET',
    })
    const response = await result.json()
    return response
  } catch (error) {
    console.error("Error in getSubmissionPhotosById:", error);
    throw error;
  }
}

export async function getSubmissionPhotosStorage(id: string) {
  try {
    const result = await fetch(`/api/submission_storage/${id}`, {
      method: 'GET',
    });
    const response = await result.json();
    return response;
  } catch (error) {
    console.error('Error in getSubmissionPhotosStorage:', error);
    throw error;
  }
}

export async function getSubmissionsBySubmissionId(id: string) {
  try {
    const result = await fetch(`/api/submissions/${id}`);
    if (!result.ok) {
      console.error("Error fetching submission:", result.statusText);
      return;
    }

    const response = await result.json();
    return response;
  } catch (error) {
    console.error('Error in getSubmissionsBySubmissionId:', error);
    throw error;
  }
}