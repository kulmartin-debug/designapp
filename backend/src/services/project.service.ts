import { prisma } from '../prisma.js';
import { ApiError } from '../types/errors.js';
import { getProjectTotalCostUsd } from './cost.service.js';

export async function createProject(input: { name: string; note?: string }) {
  if (!input.name?.trim()) {
    throw ApiError.invalidInput('Project name is required');
  }
  return prisma.project.create({ data: { name: input.name.trim(), note: input.note } });
}

export async function listProjects() {
  const projects = await prisma.project.findMany({ orderBy: { createdAt: 'desc' } });
  return Promise.all(
    projects.map(async (project) => ({
      ...project,
      totalCostUsd: await getProjectTotalCostUsd(project.id),
    })),
  );
}

export async function getProjectDetail(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      assets: { orderBy: { createdAt: 'desc' } },
      jobs: { orderBy: { createdAt: 'desc' }, include: { variants: true } },
      comparisons: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!project) throw ApiError.notFound('Project not found');
  return { ...project, totalCostUsd: await getProjectTotalCostUsd(id) };
}

export async function updateProject(id: string, input: { name?: string; note?: string }) {
  await getProjectDetail(id);
  return prisma.project.update({ where: { id }, data: input });
}

export async function deleteProject(id: string) {
  await getProjectDetail(id);
  await prisma.project.delete({ where: { id } });
}
