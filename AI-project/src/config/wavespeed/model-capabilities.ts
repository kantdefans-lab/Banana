export type ManualWaveSpeedModelCapability = {
  aspectRatios?: string[];
  supportsAllAspectRatios?: boolean;
};

// Manual model ratio mapping for WaveSpeed.
// Fill this map to control which models appear for each aspect ratio in image generation.
//
// Key formats:
// - Exact model id: "provider/model-name"
// - Prefix wildcard: "provider/*" (matches all model ids starting with "provider/")
//
// Example:
// "black-forest-labs/flux-2-krea-text-to-image": { aspectRatios: ["1:1"] }
// "openai/*": { supportsAllAspectRatios: true }
const MANUAL_WAVESPEED_MODEL_CAPABILITIES: Record<
  string,
  ManualWaveSpeedModelCapability
> = {
  "black-forest-labs/flux-2-krea-text-to-image": { aspectRatios: ["1:1"] },
  "some-provider/some-model": { aspectRatios: ["1:1", "4:3", "3:4"] },
  "openai/*": { supportsAllAspectRatios: true }
};

function normalizeRatio(value: string): string {
  return String(value).replace(/\s+/g, '');
}

function normalizeCapability(
  capability: ManualWaveSpeedModelCapability
): ManualWaveSpeedModelCapability | null {
  const aspectRatios = Array.isArray(capability.aspectRatios)
    ? Array.from(
        new Set(
          capability.aspectRatios
            .map((item) => normalizeRatio(item))
            .filter((item) => /^\d+(?:\.\d+)?:\d+(?:\.\d+)?$/.test(item))
        )
      )
    : [];

  const normalized: ManualWaveSpeedModelCapability = {};
  if (aspectRatios.length > 0) {
    normalized.aspectRatios = aspectRatios;
  }
  if (capability.supportsAllAspectRatios) {
    normalized.supportsAllAspectRatios = true;
  }

  if (!normalized.aspectRatios && !normalized.supportsAllAspectRatios) {
    return null;
  }

  return normalized;
}

export function getManualWaveSpeedModelCapabilities(
  modelId: string
): ManualWaveSpeedModelCapability | null {
  if (!modelId) return null;

  const exact = MANUAL_WAVESPEED_MODEL_CAPABILITIES[modelId];
  if (exact) {
    return normalizeCapability(exact);
  }

  for (const [key, value] of Object.entries(MANUAL_WAVESPEED_MODEL_CAPABILITIES)) {
    if (!key.endsWith('*')) continue;
    const prefix = key.slice(0, -1);
    if (!prefix) continue;
    if (modelId.startsWith(prefix)) {
      return normalizeCapability(value);
    }
  }

  return null;
}

