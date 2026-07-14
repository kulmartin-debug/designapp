import type { Request, Response } from 'express';
import * as jobService from '../services/job.service.js';

export async function createCurrentState(req: Request, res: Response) {
  const job = await jobService.createCurrentStateJob(req.params.id, req.body);
  res.status(201).json(job);
}

export async function createSketchRender(req: Request, res: Response) {
  const job = await jobService.createSketchRenderJob(req.params.id, req.body);
  res.status(201).json(job);
}

export async function list(req: Request, res: Response) {
  res.json(await jobService.listJobs(req.params.id));
}

export async function getDetail(req: Request, res: Response) {
  res.json(await jobService.getJobOrThrow(req.params.id));
}

export async function retry(req: Request, res: Response) {
  res.json(await jobService.retryJob(req.params.id));
}

export async function selectVariant(req: Request, res: Response) {
  res.json(await jobService.selectVariant(req.params.id, req.body.variantId));
}
