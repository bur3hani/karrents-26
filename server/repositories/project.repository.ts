import { db, Project, Note, UserNotification } from '../db.js';

export class ProjectRepository {
  async findById(id: string): Promise<Project | undefined> {
    return db.projects.findById(id);
  }

  async findMany(orgId: string): Promise<Project[]> {
    return db.projects.findMany(orgId);
  }

  async create(orgId: string, name: string, description: string): Promise<Project> {
    return db.projects.create(orgId, name, description);
  }

  async update(id: string, fields: Partial<Pick<Project, 'name' | 'description' | 'status'>>): Promise<Project | undefined> {
    return db.projects.update(id, fields);
  }

  async delete(id: string): Promise<Project | undefined> {
    return db.projects.delete(id);
  }

  // --- Notes Operations ---
  async findNotes(projectId: string): Promise<Note[]> {
    return db.notes.findMany(projectId);
  }

  async createNote(projectId: string, content: string, createdByEmail: string): Promise<Note> {
    return db.notes.create(projectId, content, createdByEmail);
  }

  async deleteNote(id: string): Promise<void> {
    db.notes.delete(id);
  }

  // --- Notifications Operations ---
  async findNotifications(userId: string): Promise<UserNotification[]> {
    return db.notifications.findMany(userId);
  }

  async createNotification(userId: string, title: string, message: string): Promise<UserNotification> {
    return db.notifications.create(userId, title, message);
  }

  async markNotificationAsRead(id: string): Promise<UserNotification | undefined> {
    return db.notifications.markAsRead(id);
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    db.notifications.markAllAsRead(userId);
  }
}

export const projectRepository = new ProjectRepository();
