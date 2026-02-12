type AnyRecord = Record<string, unknown>;

function toRecord(value: unknown): AnyRecord | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return value as AnyRecord;
}

function readPath(source: unknown, path: string[]) {
  let current: unknown = source;

  for (const key of path) {
    const record = toRecord(current);
    if (!record || !(key in record)) {
      return undefined;
    }

    current = record[key];
  }

  return current;
}

function toText(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const text = value.trim();
    return text ? text : undefined;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return undefined;
}

function findFirstText(source: unknown, paths: string[][]): string | undefined {
  for (const path of paths) {
    const text = toText(readPath(source, path));
    if (text) {
      return text;
    }
  }

  return undefined;
}

export function getAuthErrorDetails(
  error: unknown,
  fallback = 'Unknown error'
): { message: string; hint?: string } {
  const fallbackMessage = fallback.trim() || 'Unknown error';

  let message = '';

  if (error instanceof Error && error.message) {
    message = error.message.trim();
  } else if (typeof error === 'string') {
    message = error.trim();
  }

  if (!message) {
    message =
      findFirstText(error, [
        ['error', 'data', 'message'],
        ['error', 'message'],
        ['data', 'message'],
        ['response', 'data', 'message'],
        ['message'],
        ['cause', 'message'],
        ['statusText'],
        ['code'],
      ]) || fallbackMessage;
  }

  const hint = findFirstText(error, [
    ['error', 'data', 'hint'],
    ['error', 'hint'],
    ['data', 'hint'],
    ['response', 'data', 'hint'],
    ['hint'],
  ]);

  return hint ? { message, hint } : { message };
}

export function formatAuthErrorMessage(
  error: unknown,
  fallback = 'Unknown error'
) {
  const details = getAuthErrorDetails(error, fallback);

  if (!details.hint) {
    return details.message;
  }

  if (details.message.toLowerCase().includes(details.hint.toLowerCase())) {
    return details.message;
  }

  return `${details.message} (${details.hint})`;
}
