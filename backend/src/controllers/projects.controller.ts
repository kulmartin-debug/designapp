import type { Request, Response } from 'express';
import * as projectService from '../services/project.service.js';

export async function create(req: Request, res: Response) {
  const project = await projectService.createProject(req.body);
  res.status(201).json(project);
}

export async function list(_req: Request, res: Response) {
  res.json(await projectService.listProjects());
}

export async function getDetail(req: Request, res: Response) {
  res.json(await projectService.getProjectDetail(req.params.id));
}

export async function update(req: Request, res: Response) {
  res.json(await projectService.updateProject(req.params.id, req.body));
}

export async function remove(req: Request, res: Response) {
  await projectService.deleteProject(req.params.id);
  res.status(204).send();
}
