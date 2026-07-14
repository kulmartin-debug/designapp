import type { Request, Response } from 'express';
import type { AssetCategory } from '@prisma/client';
import * as assetService from '../services/asset.service.js';
import { storage } from '../storage/index.js';
import { ApiError } from '../types/errors.js';

export async function upload(req: Request, res: Response) {
  if (!req.file) throw ApiError.invalidInput('Missing file');
  const asset = await assetService.uploadAsset(req.params.id, req.body.category as AssetCategory, req.file);
  res.status(201).json(asset);
}

export async function list(req: Request, res: Response) {
  const category = req.query.category as AssetCategory | undefined;
  res.json(await assetService.listAssets(req.params.id, category));
}

export async function getFile(req: Request, res: Response) {
  const asset = await assetService.getAssetOrThrow(req.params.id);
  const buffer = await storage.read(asset.storageKey);
  res.setHeader('Content-Type', asset.mimeType);
  res.send(buffer);
}

export async function remove(req: Request, res: Response) {
  await assetService.deleteAsset(req.params.id);
  res.status(204).send();
}
