
export async function getSubmissionById(id: string) {
  try {
    // Call the API endpoint for a specific submission ID
    const result = await fetch(`/api/submissions/${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    });

    if (!result.ok) {
        // Handle HTTP errors (e.g., 404 Not Found, 500 Internal Server Error)
        const errorData = await result.json().catch(() => ({ message: "Failed to fetch submission" }));
        throw new Error(errorData.message || `HTTP error! status: ${result.status}`);
    }

    const response = await result.json();
    return response;
  } catch (error) {
    console.error("Error in getSubmissionById (Repository):", error);
    // Re-throw the error to be handled by the caller (e.g., in the UI component)
    throw error;
  }
}

export async function getSubmissionPhotosById(id: string) {
  try {
    // Call the API endpoint, passing the submission ID as a query parameter
    const result = await fetch(`/api/submission_photos?id=${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    });

     if (!result.ok) {
        // Handle HTTP errors
        const errorData = await result.json().catch(() => ({ message: "Failed to fetch submission photos" }));
        throw new Error(errorData.message || `HTTP error! status: ${result.status}`);
    }

    const response = await result.json();
    return response;
  } catch (error) {
    console.error("Error in getSubmissionPhotosById (Repository):", error);
    throw error;
  }
}

// Add other repository functions here following the same pattern:
// - Fetch data from the appropriate API endpoint.
// - Handle potential HTTP errors.
// - Parse the JSON response.
// - Re-throw errors for the caller to handle.

// Example for fetching all submissions (assuming an API endpoint exists at /api/submissions)
export async function getAllSubmissions() {
  try {
    const result = await fetch('/api/submissions', { // Needs an API route like app/api/submissions/route.ts
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    });
    if (!result.ok) {
        const errorData = await result.json().catch(() => ({ message: "Failed to fetch submissions" }));
        throw new Error(errorData.message || `HTTP error! status: ${result.status}`);
    }
    const response = await result.json();
    return response;
  } catch (error) {
    console.error("Error in getAllSubmissions (Repository):", error);
    throw error;
  }
}

// Example for creating a submission (assuming POST endpoint at /api/submissions)
export async function createSubmission(submissionData: any, photoFiles?: File[]) {
  try {
    // If you need to handle file uploads, FormData is typically used.
    // This example assumes JSON data for simplicity. Adjust as needed.
    const result = await fetch('/api/submissions', { // Needs an API route like app/api/submissions/route.ts with POST handler
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
    });

    if (!result.ok) {
        const errorData = await result.json().catch(() => ({ message: "Failed to create submission" }));
        throw new Error(errorData.message || `HTTP error! status: ${result.status}`);
    }
    const response = await result.json();
    return response;
  } catch (error) {
    console.error("Error in createSubmission (Repository):", error);
    throw error;
  }
}

// Example for updating a submission (assuming PUT endpoint at /api/submissions/[id])
export async function updateSubmission(id: string, submissionUpdateData: any) {
  try {
    const result = await fetch(`/api/submissions/${id}`, { // Needs API route app/api/submissions/[id]/route.ts with PUT handler
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionUpdateData),
    });
     if (!result.ok) {
        const errorData = await result.json().catch(() => ({ message: "Failed to update submission" }));
        throw new Error(errorData.message || `HTTP error! status: ${result.status}`);
    }
    const response = await result.json();
    return response;
  } catch (error) {
    console.error("Error in updateSubmission (Repository):", error);
    throw error;
  }
}

// Example for deleting a submission (assuming DELETE endpoint at /api/submissions/[id])
export async function deleteSubmission(id: string) {
  try {
    const result = await fetch(`/api/submissions/${id}`, { // Needs API route app/api/submissions/[id]/route.ts with DELETE handler
        method: 'DELETE',
    });
    if (!result.ok) {
        const errorData = await result.json().catch(() => ({ message: "Failed to delete submission" }));
        throw new Error(errorData.message || `HTTP error! status: ${result.status}`);
    }
    // DELETE might not return a body or return status only
    return { success: true };
  } catch (error) {
    console.error("Error in deleteSubmission (Repository):", error);
    throw error;
  }
}

export const fetchSubmissionCount = async (): Promise<number> => {
  const res = await fetch("/api/submissions/count");
  if (!res.ok) throw new Error("Failed to fetch user count");
  const { count } = await res.json();
  return count;
};
