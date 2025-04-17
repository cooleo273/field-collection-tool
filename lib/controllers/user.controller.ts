import { NextRequest, NextResponse } from "next/server";
import UserService from '../services/users.service';

export default class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async getAllUsers(req: any, res: any): Promise<void> {
    try {
      const users = await this.userService.getUsers();
      res.status(200).json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  async getUserById(id: string): Promise<any> {
    try {
      const user = await this.userService.getUserById(id);
      if (!user) {
        return { status: 404, json: { error: 'User not found' } };
      }
      return { status: 200, json: user };
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return { status: 500, json: { error: 'Failed to fetch user' } };
    }
  }

  async createUser(req: any, res: any): Promise<void> {
    try {
      const userData = req.body;
      const user = await this.userService.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }

  async updateUser(req: any, res: any): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedUser = await this.userService.updateUser(id, updateData);
      if (!updatedUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  async deleteUser(req: any, res: any): Promise<void> {
    try {
      const { id } = req.params;
      const success = await this.userService.deleteUser(id);
      if (!success) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  async getUsersByRole(req: any, res: any): Promise<void> {
    try {
      const { role } = req.params;
      const users = await this.userService.getUsersByRole(role);
      res.status(200).json(users);
    } catch (error) {
      console.error('Error fetching users by role:', error);
      res.status(500).json({ error: 'Failed to fetch users by role' });
    }
  }

  async resetUserPassword(req: any, res: any): Promise<void> {
    try {
      const { id } = req.params;
      const message = await this.userService.resetUserPassword(id);
      res.status(200).json({ message });
    } catch (error) {
      console.error('Error resetting user password:', error);
      res.status(500).json({ error: 'Failed to reset user password' });
    }
  }

  async assignProjectsToAdmin(req: any, res: any): Promise<void> {
    try {
      const { adminId } = req.params;
      const { projectIds } = req.body;
      await this.userService.assignProjectsToAdmin(adminId, projectIds);
      res.status(200).json({ message: 'Projects assigned successfully' });
    } catch (error) {
      console.error('Error assigning projects to admin:', error);
      res.status(500).json({ error: 'Failed to assign projects to admin' });
    }
  }

  async assignLocationsToPromoter(req: any, res: any): Promise<void> {
    try {
      const { userId, projectId } = req.params;
      const { locationIds } = req.body;
      const success = await this.userService.assignLocationsToPromoter(userId, projectId, locationIds);
      res.status(200).json({ success });
    } catch (error) {
      console.error('Error assigning locations to promoter:', error);
      res.status(500).json({ error: 'Failed to assign locations to promoter' });
    }
  }

  async getProjectPromoters(req: any, res: any): Promise<void> {
    try {
      const { projectId, adminId } = req.params;
      const promoters = await this.userService.getProjectPromoters(projectId, adminId);
      res.status(200).json(promoters);
    } catch (error) {
      console.error('Error fetching project promoters:', error);
      res.status(500).json({ error: 'Failed to fetch project promoters' });
    }
  }

  async getAdminProjects(req: any, res: any): Promise<void> {
    try {
      const { adminId } = req.params;
      const projects = await this.userService.getAdminProjects(adminId);
      res.status(200).json(projects);
    } catch (error) {
      console.error('Error fetching admin projects:', error);
      res.status(500).json({ error: 'Failed to fetch admin projects' });
    }
  }

  async getUserCount(req: NextRequest) {
    return this.handleRequest(req, async () => {
      return this.userService.getUserCount();
    });
  }

  private async handleRequest(
    req: NextRequest,
    handler: () => Promise<any>
  ): Promise<NextResponse> {
    try {
      const data = await handler();
      return NextResponse.json(data);
    } catch (error) {
      console.error("Error in UserController:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "An error occurred" },
        { status: 500 }
      );
    }
  }
}