import { Request, Response, NextFunction } from 'express';
import { projectService } from '../services/project.service';
import { sendSuccess, sendError } from '../utils/response';
import { getParam } from '../utils/params';
import type { projectListQuerySchema } from '../validators/auth.validator';
import type { z } from 'zod';

type ProjectListQuery = z.infer<typeof projectListQuerySchema>;

export async function listProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await projectService.listProjects(res.locals.validatedQuery as ProjectListQuery);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function getProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await projectService.getProjectById(getParam(req, 'id'));
    if (!project) {
      sendError(res, 'Project not found', 404);
      return;
    }
    sendSuccess(res, project);
  } catch (error) {
    next(error);
  }
}

export async function updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await projectService.updateProject(getParam(req, 'id'), req.body);
    if (!project) {
      sendError(res, 'Project not found', 404);
      return;
    }
    sendSuccess(res, project, 'Project updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const deleted = await projectService.deleteProject(getParam(req, 'id'));
    if (!deleted) {
      sendError(res, 'Project not found', 404);
      return;
    }
    sendSuccess(res, null, 'Project deleted successfully. Documents were kept.');
  } catch (error) {
    next(error);
  }
}
