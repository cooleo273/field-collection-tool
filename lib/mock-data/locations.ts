// Mock locations data
const locations = [
  {
    id: "1",
    name: "Kebele 01",
    type: "kebele",
    parentId: "10",
    campaignIds: ["1", "2"],
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  },
  {
    id: "2",
    name: "Kebele 02",
    type: "kebele",
    parentId: "10",
    campaignIds: ["1"],
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  },
  {
    id: "3",
    name: "Kebele 03",
    type: "kebele",
    parentId: "11",
    campaignIds: ["2"],
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  },
  {
    id: "4",
    name: "Kebele 04",
    type: "kebele",
    parentId: "11",
    campaignIds: ["1", "2"],
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  },
  {
    id: "10",
    name: "District A",
    type: "district",
    parentId: "100",
    campaignIds: ["1", "2"],
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  },
  {
    id: "11",
    name: "District B",
    type: "district",
    parentId: "100",
    campaignIds: ["1", "2"],
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  },
  {
    id: "100",
    name: "Zone 1",
    type: "zone",
    parentId: "1000",
    campaignIds: ["1", "2"],
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  },
  {
    id: "1000",
    name: "Region X",
    type: "region",
    campaignIds: ["1", "2"],
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-01-01"),
  },
]

// Get all locations
export async function getLocations() {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))
  return [...locations]
}

// Get location by ID
export async function getLocationById(id: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200))
  return locations.find((location) => location.id === id)
}

// Get locations by campaign ID
export async function getLocationsByCampaign(campaignId: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))
  return locations.filter((location) => location.campaignIds.includes(campaignId))
}

// Create a new location
export async function createLocation(location: any) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  locations.push(location)
  return location
}

// Update a location
export async function updateLocation(id: string, data: any) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  const index = locations.findIndex((location) => location.id === id)
  if (index !== -1) {
    locations[index] = { ...locations[index], ...data, updatedAt: new Date() }
    return locations[index]
  }
  return null
}

// Delete a location
export async function deleteLocation(id: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 400))
  const index = locations.findIndex((location) => location.id === id)
  if (index !== -1) {
    const location = locations[index]
    locations.splice(index, 1)
    return location
  }
  return null
}

