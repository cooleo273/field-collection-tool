// Mock submissions data
const submissions = [
  {
    id: "1",
    campaignId: "1",
    locationId: "1",
    locationName: "Kebele 01",
    communityGroupId: "1",
    communityGroupName: "Women's Association",
    communityGroupType: "Women's Group",
    participantCount: 25,
    keyIssues:
      "Discussed water access issues and potential solutions. Group members expressed interest in community-led initiatives.",
    photoProof: ["/placeholder.svg?height=200&width=300"],
    status: "approved",
    submittedBy: "3", // Promoter ID
    submittedAt: new Date("2023-03-10"),
    reviewedBy: "2", // Project Admin ID
    reviewedAt: new Date("2023-03-11"),
    reviewNotes: "Well documented session with good participation.",
    createdAt: new Date("2023-03-10"),
    updatedAt: new Date("2023-03-11"),
    syncStatus: "synced",
  },
  {
    id: "2",
    campaignId: "1",
    locationId: "2",
    locationName: "Kebele 02",
    communityGroupId: "3",
    communityGroupName: "Farmers Association",
    communityGroupType: "Professional Group",
    participantCount: 18,
    keyIssues:
      "Focused on sustainable farming practices and climate adaptation strategies. Participants shared local knowledge.",
    photoProof: ["/placeholder.svg?height=200&width=300"],
    status: "approved",
    submittedBy: "3", // Promoter ID
    submittedAt: new Date("2023-03-15"),
    reviewedBy: "2", // Project Admin ID
    reviewedAt: new Date("2023-03-16"),
    reviewNotes: "Good engagement from participants.",
    createdAt: new Date("2023-03-15"),
    updatedAt: new Date("2023-03-16"),
    syncStatus: "synced",
  },
  {
    id: "3",
    campaignId: "2",
    locationId: "3",
    locationName: "Kebele 03",
    communityGroupId: "4",
    communityGroupName: "School Committee",
    communityGroupType: "Educational Group",
    participantCount: 12,
    keyIssues: "Discussed hygiene education in schools and potential for student-led awareness campaigns.",
    photoProof: ["/placeholder.svg?height=200&width=300"],
    status: "submitted",
    submittedBy: "3", // Promoter ID
    submittedAt: new Date("2023-03-20"),
    createdAt: new Date("2023-03-20"),
    updatedAt: new Date("2023-03-20"),
    syncStatus: "synced",
  },
  {
    id: "4",
    campaignId: "2",
    locationId: "4",
    locationName: "Kebele 04",
    communityGroupId: "5",
    communityGroupName: "Health Volunteers",
    communityGroupType: "Health Group",
    participantCount: 15,
    keyIssues: "Training on basic health education and preventive measures for common diseases.",
    photoProof: ["/placeholder.svg?height=200&width=300"],
    status: "rejected",
    submittedBy: "3", // Promoter ID
    submittedAt: new Date("2023-03-25"),
    reviewedBy: "2", // Project Admin ID
    reviewedAt: new Date("2023-03-26"),
    reviewNotes: "Insufficient details provided. Please include more specific information about the training content.",
    createdAt: new Date("2023-03-25"),
    updatedAt: new Date("2023-03-26"),
    syncStatus: "synced",
  },
]

// Get all submissions
export async function getSubmissions(userId?: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  if (userId) {
    // If userId is provided, filter by submittedBy
    return [...submissions.filter((sub) => sub.submittedBy === userId)]
  }

  return [...submissions]
}

// Get submission by ID
export async function getSubmissionById(id: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))
  return submissions.find((submission) => submission.id === id)
}

// Get submissions by status
export async function getSubmissionsByStatus(status: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 400))
  return submissions.filter((submission) => submission.status === status)
}

// Get submissions by campaign
export async function getSubmissionsByCampaign(campaignId: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 400))
  return submissions.filter((submission) => submission.campaignId === campaignId)
}

// Create a new submission
export async function createSubmission(submission: any) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))
  submissions.push(submission)
  return submission
}

// Update a submission
export async function updateSubmission(id: string, data: any) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 700))
  const index = submissions.findIndex((submission) => submission.id === id)
  if (index !== -1) {
    submissions[index] = { ...submissions[index], ...data, updatedAt: new Date() }
    return submissions[index]
  }
  return null
}

// Delete a submission
export async function deleteSubmission(id: string) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 600))
  const index = submissions.findIndex((submission) => submission.id === id)
  if (index !== -1) {
    const submission = submissions[index]
    submissions.splice(index, 1)
    return submission
  }
  return null
}

