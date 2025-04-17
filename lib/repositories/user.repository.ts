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