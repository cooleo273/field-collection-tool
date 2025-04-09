// Mock community groups data
const communityGroups = [
  {
    id: "1",
    name: "Women's Association",
    type: "Women's Group",
    locationId: "1",
    campaignId: "1",
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2023-01-15"),
  },
  {
    id: "2",
    name: "Youth Club",
    type: "Youth Group",
    locationId: "1",
    campaignId: "1",
    createdAt: new Date("2023-01-20"),
    updatedAt: new Date("2023-01-20"),
  },
  {
    id: "3",
    name: "Farmers Association",
    type: "Professional Group",
    locationId: "2",
    campaignId: "1",
    createdAt: new Date("2023-01-25"),
    updatedAt: new Date("2023-01-25"),
  },
  {
    id: "4",
    name: "School Committee",
    type: "Educational Group",
    locationId: "3",
    campaignId: "2",
    createdAt: new Date("2023-02-01"),
    updatedAt: new Date("2023-02-01"),
  },
  {
    id: "5",
    name: "Health Volunteers",
    type: "Health Group",
    locationId: "4",
    campaignId: "2",
    createdAt: new Date("2023-02-05"),
    updatedAt: new Date("2023-02-05"),
  },
]

// Community group types
const communityGroupTypes = [
  "Women's Group",
  "Youth Group",
  "Professional Group",
  "Educational Group",
  "Health Group",
  "Religious Group",
  "Community Leaders",
  "Other",
]

// Get all community groups
export async function getCommunityGroups() {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))
  return [...communityGroups]
}

// Get community group by ID
export async function getCommunityGroupById(id: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200))
  return communityGroups.find((group) => group.id === id)
}

// Get community groups by location
export async function getCommunityGroupsByLocation(locationId: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))
  return communityGroups.filter((group) => group.locationId === locationId)
}

// Get community groups by campaign
export async function getCommunityGroupsByCampaign(campaignId: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))
  return communityGroups.filter((group) => group.campaignId === campaignId)
}

// Get all community group types
export async function getCommunityGroupTypes() {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200))
  return [...communityGroupTypes]
}

// Create a new community group
export async function createCommunityGroup(group: any) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  communityGroups.push(group)
  return group
}

// Update a community group
export async function updateCommunityGroup(id: string, data: any) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  const index = communityGroups.findIndex((group) => group.id === id)
  if (index !== -1) {
    communityGroups[index] = { ...communityGroups[index], ...data, updatedAt: new Date() }
    return communityGroups[index]
  }
  return null
}

// Delete a community group
export async function deleteCommunityGroup(id: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 400))
  const index = communityGroups.findIndex((group) => group.id === id)
  if (index !== -1) {
    const group = communityGroups[index]
    communityGroups.splice(index, 1)
    return group
  }
  return null
}

