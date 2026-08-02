import { Response } from 'express';
import { projectService } from '../services/project.service.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export class ProjectController {
  async listProjects(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const projects = await projectService.getProjects(req.user.organization_id);
      return res.json(projects);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const project = await projectService.getProjectById(id, req.user.organization_id);
      return res.json(project);
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  }

  async createProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, description } = req.body;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const project = await projectService.createProject(
        req.user.organization_id,
        name,
        description,
        req.user,
        req.ip
      );
      return res.status(201).json(project);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async updateProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, status } = req.body;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const updated = await projectService.updateProject(
        id,
        req.user.organization_id,
        { name, description, status },
        req.user,
        req.ip
      );
      return res.json(updated);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async deleteProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      await projectService.deleteProject(id, req.user.organization_id, req.user, req.ip);
      return res.json({ message: "Project deleted successfully" });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  // --- Project Notes ---
  async listNotes(req: AuthenticatedRequest, res: Response) {
    try {
      const { id: projectId } = req.params;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const notes = await projectService.getProjectNotes(projectId, req.user.organization_id);
      return res.json(notes);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async createNote(req: AuthenticatedRequest, res: Response) {
    try {
      const { id: projectId } = req.params;
      const { content } = req.body;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      const note = await projectService.createProjectNote(projectId, req.user.organization_id, content, req.user.email);
      return res.status(201).json(note);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  async deleteNote(req: AuthenticatedRequest, res: Response) {
    try {
      const { noteId } = req.params;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });

      await projectService.deleteProjectNote(noteId, req.user.organization_id);
      return res.json({ message: "Note deleted successfully" });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  // --- Alerts / Notifications ---
  async listNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const alerts = await projectService.getUserNotifications(req.user.id);
      return res.json(alerts);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async readAllNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      await projectService.markAllNotificationsAsRead(req.user.id);
      return res.json({ message: "All alerts acknowledged" });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  async readNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      await projectService.markNotificationAsRead(id);
      return res.json({ message: "Alert acknowledged" });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }
}

export const projectController = new ProjectController();
