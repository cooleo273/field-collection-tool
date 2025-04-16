import { NextRequest } from "next/server";

export async function signIn(req: NextRequest) {
  const { email, password } = await req.json();
  try {
    const result = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'signIn', email, password }),
    });
    const response = await result.json();
    return response;
  } catch (error) {
    console.error('Error in signIn:', error);
    throw error;
  }
}

export async function signOut(req: NextRequest) {
  try {
    const result = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'signOut' }),
    });
    const response = await result.json();
    return response;
  } catch (error) {
    console.error('Error in signOut:', error);
    throw error;
  }
}

export async function getSession(req: NextRequest) {
  try {
    const result = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'getSession' }),
    });
    const response = await result.json();
    return response;
  } catch (error) {
    console.error('Error in getSession:', error);
    throw error;
  }
}

export async function getCurrentUser(req: NextRequest) {
  try {
    const result = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'getCurrentUser' }),
    });
    const response = await result.json();
    return response;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    throw error;
  }
}