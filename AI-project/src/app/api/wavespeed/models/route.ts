import { NextRequest, NextResponse } from 'next/server';

import { getWaveSpeedRequestSchemaProperties, listModels } from '@/shared/lib/wavespeed';
import { getAllConfigs } from '@/shared/models/config';
import { getRuntimeEnv } from '@/shared/lib/env';

export const dynamic = 'force-dynamic';

type WaveSpeedModelBrief = {
  model_id: string;
  name?: string;
  type?: string;
  description?: string;
  base_price?: number | string;
  sort_order?: number;
};

type WaveSpeedModelCapabilities = {
  aspectRatios?: string[];
  supportsAllAspectRatios?: boolean;
  sizes?: string[];
};

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x || 1;
}

function parseRatioFromSizeToken(token: string): string | null {
  const m = String(token).trim().match(/^(\d+)\s*[x\*]\s*(\d+)$/i);
  if (!m) return null;
  const w = Number(m[1]);
  const h = Number(m[2]);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  const g = gcd(w, h);
  return `${Math.round(w / g)}:${Math.round(h / g)}`;
}

function parseNumericAspectRatio(value: any): string | null {
  const s = String(value || '').replace(/\s+/g, '');
  if (!/^\d+(?:\.\d+)?:\d+(?:\.\d+)?$/.test(s)) return null;
  return s;
}

function uniqStrings(items: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of items) {
    const v = String(s);
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function getRequestSchemas(model: any): any[] {
  const schemas: any[] = [];

  const direct =
    model?.api_schema?.request_schema ||
    model?.api_schema?.requestSchema ||
    model?.apiSchema?.request_schema ||
    model?.apiSchema?.requestSchema ||
    null;
  if (direct && typeof direct === 'object') {
    schemas.push(direct);
  }

  const apiSchemas =
    model?.api_schema?.api_schemas ||
    model?.api_schema?.apiSchemas ||
    model?.apiSchema?.api_schemas ||
    model?.apiSchema?.apiSchemas ||
    null;

  if (Array.isArray(apiSchemas)) {
    for (const schema of apiSchemas) {
      const requestSchema =
        schema?.request_schema || schema?.requestSchema || null;
      if (requestSchema && typeof requestSchema === 'object') {
        schemas.push(requestSchema);
      }
    }
  }

  return schemas;
}

function extractRatiosFromExamples(input: any): string[] {
  const ratios: string[] = [];
  const visit = (node: any) => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (typeof node !== 'object') return;

    for (const [key, value] of Object.entries(node)) {
      if (value == null) continue;
      if (key === 'aspect_ratio' || key === 'aspectRatio') {
        const parsed = parseNumericAspectRatio(value);
        if (parsed) ratios.push(parsed);
      } else if (key === 'size' && typeof value === 'string') {
        const parsed = parseRatioFromSizeToken(value);
        if (parsed) ratios.push(parsed);
      } else if (typeof value === 'object') {
        visit(value);
      }
    }
  };
  visit(input);
  return ratios;
}

function deriveCapabilities(model: any): WaveSpeedModelCapabilities | null {
  const props = getWaveSpeedRequestSchemaProperties(model);
  const requestSchemas = getRequestSchemas(model);

  if (!props || typeof props !== 'object') {
    return null;
  }

  const ratioEnumRaw =
    props?.aspect_ratio?.enum ??
    props?.aspectRatio?.enum ??
    null;

  const ratiosFromEnum = Array.isArray(ratioEnumRaw)
    ? ratioEnumRaw
        .map((x: any) => String(x))
        .map((s: string) => parseNumericAspectRatio(s))
        .filter(Boolean) as string[]
    : [];

  const ratioFromAspectDefault = parseNumericAspectRatio(
    props?.aspect_ratio?.default ?? props?.aspectRatio?.default
  );

  const sizeEnumRaw = props?.size?.enum ?? null;
  const sizes = Array.isArray(sizeEnumRaw)
    ? sizeEnumRaw.map((x: any) => String(x)).filter(Boolean)
    : [];
  const sizeDefault = props?.size?.default;
  if (typeof sizeDefault === 'string') {
    sizes.push(sizeDefault);
  }

  const ratiosFromSizes = sizes
    .map((s) => parseRatioFromSizeToken(s))
    .filter(Boolean) as string[];

  const ratiosFromExamples = requestSchemas.flatMap((schema) =>
    extractRatiosFromExamples(schema?.examples ?? schema?.example ?? null)
  );

  const aspectRatios = uniqStrings([
    ...ratiosFromEnum,
    ...(ratioFromAspectDefault ? [ratioFromAspectDefault] : []),
    ...ratiosFromSizes,
    ...ratiosFromExamples,
  ]);

  const hasWidthHeight = !!props?.width && !!props?.height;
  const hasAspectRatioKey = !!props?.aspect_ratio || !!props?.aspectRatio;
  const hasAspectRatioEnum =
    Array.isArray(props?.aspect_ratio?.enum) || Array.isArray(props?.aspectRatio?.enum);

  const supportsAllAspectRatios =
    hasWidthHeight || (hasAspectRatioKey && !hasAspectRatioEnum);

  const cap: WaveSpeedModelCapabilities = {};
  if (aspectRatios.length > 0) cap.aspectRatios = aspectRatios;
  if (supportsAllAspectRatios) cap.supportsAllAspectRatios = true;
  if (sizes.length > 0) cap.sizes = sizes;

  if (!cap.aspectRatios && !cap.supportsAllAspectRatios && !cap.sizes) {
    return null;
  }

  return cap;
}

function parseCsv(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  try {
    const configs = await getAllConfigs();
    const apiKey = String(
      configs.wavespeed_api_key || getRuntimeEnv('WAVESPEED_API_KEY') || ''
    );

    if (!apiKey) {
      return NextResponse.json(
        {
          code: 1,
          message:
            'WaveSpeed API key missing (wavespeed_api_key / WAVESPEED_API_KEY)',
          data: [],
        },
        { status: 500 }
      );
    }

    const url = new URL(request.url);
    const media = url.searchParams.get('media');
    const typesParam = url.searchParams.get('types');
    const includeParam = url.searchParams.get('include');
    const include = new Set(parseCsv(includeParam));
    const includeCapabilities = include.has('capabilities');

    let types: string[] = [];
    if (media === 'image') {
      types = ['text-to-image', 'image-to-image'];
    } else if (media === 'video') {
      types = ['text-to-video', 'image-to-video'];
    } else {
      types = parseCsv(typesParam);
    }

    const models = await listModels({ apiKey, signal: request.signal });
    const filtered =
      types.length > 0
        ? models.filter((m) => types.includes(String(m.type || '')))
        : models;

    let capabilitiesAvailable = false;

    const brief = filtered
      .map((m) => {
        const modelId = String(m.model_id || m.id || '');
        if (!modelId) return null;

        const schemaCap = includeCapabilities ? deriveCapabilities(m) : null;
        const cap = schemaCap;
        if (cap) capabilitiesAvailable = true;

        return {
          model_id: modelId,
          name: m.name ? String(m.name) : undefined,
          type: m.type ? String(m.type) : undefined,
          description: m.description ? String(m.description) : undefined,
          base_price:
            typeof m.base_price === 'number' || typeof m.base_price === 'string'
              ? m.base_price
              : undefined,
          sort_order:
            typeof m.sort_order === 'number' ? (m.sort_order as number) : undefined,
          ...(includeCapabilities ? { capabilities: cap ?? undefined } : null),
        };
      })
      .filter(Boolean) as Array<WaveSpeedModelBrief & { capabilities?: WaveSpeedModelCapabilities }>;

    brief.sort((a, b) => {
      const ao = a.sort_order ?? Number.POSITIVE_INFINITY;
      const bo = b.sort_order ?? Number.POSITIVE_INFINITY;
      if (ao !== bo) return ao - bo;
      return a.model_id.localeCompare(b.model_id);
    });

    return NextResponse.json(
      {
        code: 0,
        message: 'success',
        data: brief,
        ...(includeCapabilities ? { capabilitiesAvailable } : null),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=3600',
        },
      }
    );
  } catch (error: any) {
    console.error('WaveSpeed models route error:', error);
    return NextResponse.json(
      { code: 1, message: error?.message || 'unknown error', data: [] },
      { status: 500 }
    );
  }
}
