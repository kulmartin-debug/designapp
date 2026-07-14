import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Project } from '../types/api';
import { createProject, listProjects } from '../api/projects';
import { sk } from '../i18n/sk';
import { CostBadge } from '../components/common/CostBadge';

export function ProjectListPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  async function refresh() {
    setProjects(await listProjects());
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      await createProject({ name, note: note || undefined });
      setName('');
      setNote('');
      await refresh();
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-10">
      <section className="hero-surface overflow-hidden rounded-2xl px-6 py-16 text-center sm:py-24">
        <p className="relative text-xs font-medium tracking-[0.35em] text-white/70">INTERIÉROVÝ DESIGN</p>
        <h1 className="relative mt-4 font-serif text-4xl font-light uppercase tracking-[0.18em] text-white sm:text-6xl">
          {sk.appName}
        </h1>
        <p className="relative mt-4 text-xs font-medium uppercase tracking-[0.3em] text-white/80 sm:text-sm">
          {sk.appTagline}
        </p>
      </section>

      <section className="mx-auto max-w-2xl space-y-4 text-center">
        <h2 className="font-serif text-xl uppercase tracking-[0.15em] text-ink">{sk.projectList.title}</h2>
        <form onSubmit={(e) => void handleCreate(e)} className="flex flex-col gap-3 text-left sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={sk.projectList.namePlaceholder}
            className="flex-1 rounded-md border border-line bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-brand-500 focus:outline-none"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={sk.projectList.notePlaceholder}
            className="flex-1 rounded-md border border-line bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-brand-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isCreating || !name.trim()}
            className="rounded-md bg-ink px-5 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-brand-600 disabled:opacity-40"
          >
            {sk.projectList.create}
          </button>
        </form>
      </section>

      <section className="space-y-3">
        {projects === null && <p className="text-center text-sm text-ink-soft">{sk.common.loading}</p>}
        {projects?.length === 0 && <p className="text-center text-sm text-ink-soft">{sk.projectList.empty}</p>}
        {projects?.map((project) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className="block rounded-lg border border-line bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg text-ink">{project.name}</h2>
                {project.note && <p className="text-sm text-ink-soft">{project.note}</p>}
              </div>
              <CostBadge totalCostUsd={project.totalCostUsd} />
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
