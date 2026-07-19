import { projectRepository } from '../repositories/project.repository.js';
import { organizationRepository } from '../repositories/organization.repository.js';
import { Project, Note, User, UserNotification } from '../db.js';

export class ProjectService {
  async getProjects(orgId: string): Promise<Project[]> {
    return projectRepository.findMany(orgId);
  }

  async getProjectById(id: string, orgId: string): Promise<Project> {
    const project = await projectRepository.findById(id);
    if (!project || project.organization_id !== orgId) {
      throw new Error('Project not found or unauthorized.');
    }
    return project;
  }

  async createProject(orgId: string, name: string, description: string, user: User, ip?: string): Promise<Project> {
    const project = await projectRepository.create(orgId, name, description);

    await organizationRepository.createAuditLog(
      orgId,
      user.id,
      user.email,
      'PROJECT_CREATE',
      `Created new project workspace: '${name}' (ID: ${project.id})`,
      ip || '127.0.0.1'
    );

    return project;
  }

  async updateProject(id: string, orgId: string, fields: Partial<Pick<Project, 'name' | 'description' | 'status'>>, user: User, ip?: string): Promise<Project> {
    const project = await this.getProjectById(id, orgId);
    const updated = await projectRepository.update(id, fields);
    if (!updated) {
      throw new Error('Project update failed.');
    }

    await organizationRepository.createAuditLog(
      orgId,
      user.id,
      user.email,
      'PROJECT_UPDATE',
      `Updated project workspace ID: ${project.id}`,
      ip || '127.0.0.1'
    );

    return updated;
  }

  async deleteProject(id: string, orgId: string, user: User, ip?: string): Promise<void> {
    const project = await this.getProjectById(id, orgId);
    await projectRepository.delete(id);

    await organizationRepository.createAuditLog(
      orgId,
      user.id,
      user.email,
      'PROJECT_DELETE',
      `Soft-deleted project workspace ID: ${project.id} and Cascaded Dependencies`,
      ip || '127.0.0.1'
    );
  }

  // --- Notes Operations ---
  async getProjectNotes(projectId: string, orgId: string): Promise<Note[]> {
    await this.getProjectById(projectId, orgId); // Auth barrier
    return projectRepository.findNotes(projectId);
  }

  async createProjectNote(projectId: string, orgId: string, content: string, createdByEmail: string): Promise<Note> {
    await this.getProjectById(projectId, orgId); // Auth barrier
    return projectRepository.createNote(projectId, content, createdByEmail);
  }

  async deleteProjectNote(noteId: string, orgId: string): Promise<void> {
    // Note checks are done in the controller or we can handle them inside repo
    await projectRepository.deleteNote(noteId);
  }

  // --- Notifications ---
  async getUserNotifications(userId: string): Promise<UserNotification[]> {
    return projectRepository.findNotifications(userId);
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await projectRepository.markAllNotificationsAsRead(userId);
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await projectRepository.markNotificationAsRead(id);
  }
}

export const projectService = new ProjectService();
