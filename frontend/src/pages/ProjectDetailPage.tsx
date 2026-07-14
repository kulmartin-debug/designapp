import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { AssetCategory, ProjectDetail } from '../types/api';
import { getProject } from '../api/projects';
import { UploadDropzone } from '../components/upload/UploadDropzone';
import { AssetGallery } from '../components/upload/AssetGallery';
import { CostBadge } from '../components/common/CostBadge';
import { CurrentStateEnhancePanel } from '../components/moduleB/CurrentStateEnhancePanel';
import { SketchRenderPanel } from '../components/moduleC/SketchRenderPanel';
import { ComparisonSection } from '../components/moduleD/ComparisonSection';
import { sk } from '../i18n/sk';

const UPLOAD_SECTIONS: { category: AssetCategory; multiple: boolean }[] = [
  { category: 'FOTO_SUCASNY_STAV', multiple: true },
  { category: 'PODORYS', multiple: false },
  { category: 'NAVRH_SKETCHUP', multiple: true },
];

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectDetail | null>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    setProject(await getProject(id));
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!project) {
    return <p className="text-sm text-ink-soft">{sk.common.loading}</p>;
  }

  return (
    <div className="space-y-10">
      <div>
        <Link
          to="/"
          className="text-xs font-medium uppercase tracking-[0.2em] text-ink-soft transition-colors hover:text-brand-600"
        >
          &larr; {sk.common.back}
        </Link>
        <div className="mt-3 flex items-center justify-between border-b border-line pb-4">
          <div>
            <h1 className="font-serif text-3xl text-ink">{project.name}</h1>
            {project.note && <p className="mt-1 text-sm text-ink-soft">{project.note}</p>}
          </div>
          <CostBadge totalCostUsd={project.totalCostUsd} />
        </div>
      </div>

      {UPLOAD_SECTIONS.map(({ category, multiple }) => {
        const assets = project.assets.filter((a) => a.category === category);
        return (
          <section key={category} className="space-y-3">
            <h2 className="font-serif text-lg uppercase tracking-[0.1em] text-ink">{sk.assetCategories[category]}</h2>
            <UploadDropzone projectId={project.id} category={category} multiple={multiple} onUploaded={refresh} />
            <AssetGallery assets={assets} onChanged={refresh} />
          </section>
        );
      })}

      <section className="space-y-3">
        <h2 className="font-serif text-lg uppercase tracking-[0.1em] text-ink">Vizualizácia súčasného stavu</h2>
        <CurrentStateEnhancePanel
          photos={project.assets.filter((a) => a.category === 'FOTO_SUCASNY_STAV')}
          onDone={refresh}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-lg uppercase tracking-[0.1em] text-ink">Nový návrh zo SketchUp náčrtu</h2>
        <SketchRenderPanel
          sketches={project.assets.filter((a) => a.category === 'NAVRH_SKETCHUP')}
          onDone={refresh}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-lg uppercase tracking-[0.1em] text-ink">Porovnanie PRED / PO</h2>
        <ComparisonSection
          projectId={project.id}
          assets={project.assets}
          comparisons={project.comparisons}
          onExported={refresh}
        />
      </section>
    </div>
  );
}
