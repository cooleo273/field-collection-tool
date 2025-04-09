// Mock users data
const users = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    status: "active",
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  },
  {
    id: "2",
    name: "Project Admin",
    email: "project@example.com",
    role: "project-admin",
    status: "active",
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2023-01-15"),
  },
  {
    id: "3",
    name: "Promoter User",
    email: "promoter@example.com",
    role: "promoter",
    status: "active",
    createdAt: new Date("2023-02-01"),
    updatedAt: new Date("2023-02-01"),
  },
  // Add more mock users as needed
]

// Get all users
export async function getUsers() {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  return [...users]
}

// Get user by ID
export async function getUserById(id: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))
  return users.find((user) => user.id === id)
}

// Get user by email
export function getUserByEmail(email: string) {
  return users.find((user) => user.email === email)
}

// Create a new user
export async function createUser(user: any) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))
  users.push(user)
  return user
}

// Update a user
export async function updateUser(id: string, data: any) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))
  const index = users.findIndex((user) => user.id === id)
  if (index !== -1) {
    users[index] = { ...users[index], ...data, updatedAt: new Date() }
    return users[index]
  }
  return null
}

// Delete a user
export async function deleteUser(id: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  const index = users.findIndex((user) => user.id === id)
  if (index !== -1) {
    const user = users[index]
    users.splice(index, 1)
    return user
  }
  return null
}

