
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