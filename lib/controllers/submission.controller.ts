import SubmissionService from "@/lib/services/submissions.service";

export default class SubmissionController {
  private submissionService: SubmissionService;

  constructor() {
    this.submissionService = new SubmissionService();
  }

  async getRecentSubmissions(limit: number) {
    try {
      const submissions = await this.submissionService.getRecentSubmissions(limit);
      return { status: 200, json: submissions };
    } catch (error) {
      console.error("Error fetching recent submissions:", error);
      return { status: 500, json: { error: "Failed to fetch recent submissions" } };
    }
  }
}