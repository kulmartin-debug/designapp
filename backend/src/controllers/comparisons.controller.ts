import type { Request, Response } from 'express';
import * as comparisonService from '../services/comparison.service.js';
import { storage } from '../storage/index.js';

export async function create(req: Request, res: Response) {
  const comparison = await comparisonService.createComparisonExport(req.params.id, req.body);
  res.status(201).json(comparison);
}

export async function list(req: Request, res: Response) {
  res.json(await comparisonService.listComparisons(req.params.id));
}

export async function download(req: Request, res: Response) {
  const comparison = await comparisonService.getComparisonOrThrow(req.params.id);
  const buffer = await storage.read(comparison.resultAsset.storageKey);
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Disposition', `attachment; filename="porovnanie-${comparison.id}.png"`);
  res.send(buffer);
}
