export async function getProjectById(id: string) {
  try {
    const result = await fetch(`/api/project/${id}`, {
      method: 'GET',
    });
    const response = await result.json();
    return response;
  } catch (error) {
    console.error('Error in getProjectById:', error);
    throw error;
  }
}

export async function getProjects() {
  try {
    const result = await fetch('/api/project', {
      method: 'GET',
    });
    const response = await result.json();
    return response;
  } catch (error) {
    console.error('Error in getProjects:', error);
    throw error;
  }
}

export async function createProject(projectData: any) {
  try {
    const result = await fetch('/api/project', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });
    const response = await result.json();
    return response;
  } catch (error) {
    console.error('Error in createProject:', error);
    throw error;
  }
}

export async function updateProject(id: string, projectData: any) {
  try {
    const result = await fetch(`/api/project/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });
    const response = await result.json();
    return response;
  } catch (error) {
    console.error('Error in updateProject:', error);
    throw error;
  }
}

export async function deleteProject(id: string) {
  try {
    const result = await fetch(`/api/project/${id}`, {
      method: 'DELETE',
    });
    const response = await result.json();
    return response;
  } catch (error) {
    console.error('Error in deleteProject:', error);
    throw error;
  }
}

export async function getAssignedProjects(userId: string) {
  try {
    const result = await fetch(`/api/project/assigned/${userId}`, {
      method: 'GET',
    });
    const response = await result.json();
    return response;
  } catch (error) {
    console.error('Error in getAssignedProjects:', error);
    throw error;
  }
}

export async function getAdminProjects(adminId: string) {
  try {
    const result = await fetch(`/api/project/admin/${adminId}`, {
      method: 'GET',
    });
    const response = await result.json();
    return response;
  } catch (error) {
    console.error('Error in getAdminProjects:', error);
    throw error;
  }
}

export async function assignProjectsToAdmin(adminId: string, projectIds: string[]) {
  try {
    const result = await fetch(`/api/project/admin/${adminId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectIds }),
    });
    const response = await result.json();
    return response;
  } catch (error) {
    console.error('Error in assignProjectsToAdmin:', error);
    throw error;
  }
}