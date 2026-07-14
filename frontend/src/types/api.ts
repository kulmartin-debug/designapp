export type AssetCategory =
  | 'FOTO_SUCASNY_STAV'
  | 'PODORYS'
  | 'NAVRH_SKETCHUP'
  | 'DERIVED_DEPTH_MAP'
  | 'DERIVED_CANNY_EDGE'
  | 'GENERATED_OUTPUT'
  | 'EXPORT_COMPARISON';

export type JobModule = 'CURRENT_STATE_ENHANCE' | 'SKETCH_RENDER';
export type JobStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED' | 'CANCELLED';
export type ProviderName = 'REPLICATE' | 'FAL' | 'GEMINI' | 'MOCK';
export type ProviderCheckStatus = 'OK' | 'FAILED';

export interface ProviderCredentialSummary {
  provider: ProviderName;
  hasKey: boolean;
  usingEnvFallback: boolean;
  lastStatus: ProviderCheckStatus | null;
  lastCheckedAt: string | null;
  lastError: string | null;
}

export interface Asset {
  id: string;
  projectId: string;
  category: AssetCategory;
  storageKey: string;
  originalFilename: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  createdAt: string;
}

export interface GenerationVariant {
  id: string;
  jobId: string;
  variantIndex: number;
  assetId: string;
  asset?: Asset;
  isSelected: boolean;
  createdAt: string;
}

export interface GenerationJob {
  id: string;
  projectId: string;
  module: JobModule;
  status: JobStatus;
  provider: ProviderName;
  providerModel: string | null;
  inputAssetId: string;
  styleDescription: string | null;
  resolvedPrompt: string;
  numVariantsRequested: number;
  estimatedCostUsd: number;
  actualCostUsd: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  variants: GenerationVariant[];
}

export interface ComparisonExport {
  id: string;
  projectId: string;
  beforeAssetId: string;
  afterAssetId: string;
  resultAssetId: string;
  beforeLabel: string;
  afterLabel: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  totalCostUsd: number;
}

export interface ProjectDetail extends Project {
  assets: Asset[];
  jobs: GenerationJob[];
  comparisons: ComparisonExport[];
}

export interface ApiErrorBody {
  errorCode: string;
  message: string;
}
