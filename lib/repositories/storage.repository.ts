export async function uploadImage( file: File, id: string,) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const result = await fetch(`/api/storage/${id}`, {
      method: "POST",
      body: formData,
    });

    const response = await result.json();
    return response;
  } catch (error) {
    console.error("Error in uploadImage:", error);
    throw error;
  }
}

export async function deleteImage(url: string) {
  try {
    const result = await fetch(`/api/storage/${encodeURIComponent(url)}`, {
      method: "DELETE",
    });

    const response = await result.json();
    return response;
  } catch (error) {
    console.error("Error in deleteImage:", error);
    throw error;
  }
}

export async function getPublicUrl(id: string) {
  try {
    const result = await fetch(`/api/storage/${id}`, {
      method: "GET",
    });

    const response = await result.json();
    return response;
  } catch (error) {
    console.error("Error in getPublicUrl:", error);
    throw error;
  }
}