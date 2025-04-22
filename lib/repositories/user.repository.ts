export async function getAllUsers() {
  try {
    const result = await fetch('/api/users', {
      method: 'GET',
    });
    const response = await result.json();
    return response;
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    throw error;
  }
}
export async function getUser(userId: string) {
  try {
    const result = await fetch(`/api/users/${userId}`, {
      method: 'GET',
    });
    const response = await result.json();
    return response;
  }
  catch (error) {
    console.error('Error in getUser:', error);
    throw error;
  }
}

export async function createUser(userData: any) {
  try {
    const result = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    const response = await result.json();
    return response;
  } catch (error) {
    console.error('Error in createUser:', error);
    throw error;
  }
}

export async function createUserWithAuth(userData: any) {
  try {
    const result = await fetch('/api/users?withAuth=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    const response = await result.json();
    return response;
  } catch (error) {
    console.error('Error in createUserWithAuth:', error);
    throw error;
  }
}

export async function updateUser(userId: string, userData: any) {
  try {
    const result = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    const response = await result.json();
    return response;
  } catch (error) {
    console.error('Error in updateUser:', error);
    throw error;
  }
}

export async function deleteUser(userId: string) {
  try {
    const result = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
    });
    const response = await result.json();
    return response;
  } catch (error) {
    console.error('Error in deleteUser:', error);
    throw error;
  }
}

export async function resetUserPassword(userId: string, passwordData: any) {
  try {
    const result = await fetch(`/api/users/${userId}/reset-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(passwordData),
    });
    const response = await result.json();
    return response;
  } catch (error) {
    console.error('Error in resetUserPassword:', error);
    throw error;
  }
}

export async function updateUserById(userId: string, userData: any) {
  try {
    const result = await fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    const response = await result.json();
    return response;
  } catch (error) {
    console.error('Error in updateUserById:', error);
    throw error;
  }
}

export async function deleteUserById(userId: string) {
  try {
    const result = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
    });
    const response = await result.json();
    return response;
  } catch (error) {
    console.error('Error in deleteUserById:', error);
    throw error;
  }
}

// lib/repositories/user.repository.ts
export const fetchUserCount = async (): Promise<number> => {
  const res = await fetch("/api/users/count");
  if (!res.ok) throw new Error("Failed to fetch user count");
  const { count } = await res.json();
  return count;
};

export const getUsersByRole = async (role: string): Promise<any[]> => {
  const res = await fetch(`/api/users/byrole?role=${role}`);
  if (!res.ok) throw new Error("Failed to fetch users by role");
  const response = await res.json();

  // Log the response for debugging purposes
  console.log("Response from /api/users/byrole:", response);

  // Ensure the response is always an array
  return Array.isArray(response) ? response : [response];
};
