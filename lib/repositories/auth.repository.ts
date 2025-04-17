import { NextRequest } from "next/server";

export async function signIn(email: string, password: string): Promise<{ data?: any; error?: { message: string } }> {
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in signIn:', error);
    return { error: { message: 'An unexpected error occurred during sign-in.' } };
  }
}

// export async function signOut() {
//   try {
//     const result = await fetch('/api/auth', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ action: 'signOut' }),
//     });
//     const response = await result.json();
//     return response;
//   } catch (error) {
//     console.error('Error in signOut:', error);
//     throw error;
//   }
// }

export async function getSession(): Promise<{ data?: any; error?: { message: string } }> {
  try {
    const response = await fetch('/api/session', {
      method: 'GET',
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in getSession:', error);
    return { error: { message: 'An unexpected error occurred while fetching session.' } };
  }
}

// export async function getCurrentUser(req: NextRequest) {
//   try {
//     const result = await fetch('/api/auth', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ action: 'getCurrentUser' }),
//     });
//     const response = await result.json();
//     return response;
//   } catch (error) {
//     console.error('Error in getCurrentUser:', error);
//     throw error;
//   }
// }