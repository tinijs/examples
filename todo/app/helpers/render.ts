import {TemplateResult, nothing} from 'lit';
import {cache} from 'lit/directives/cache';

export type ChunkData<Type> = Type | null | undefined;

export type ChunkDataOrError<Type> = ChunkData<Type> | Error;

export type ChunkTemplateResult = TemplateResult | typeof nothing;

export interface ChunkTemplates<Type> {
  main: (data: Type) => ChunkTemplateResult;
  loading?: () => ChunkTemplateResult;
  empty?: () => ChunkTemplateResult;
  error?: (error: Error) => ChunkTemplateResult;
}

export function renderChunk<Type>(
  data: ChunkDataOrError<Type>,
  templates: ChunkTemplates<Type>
) {
  const main = templates.main;
  const loading = templates.loading || nothing;
  const empty = templates.empty || nothing;
  const error = templates.error || nothing;
  return cache(
    data === undefined
      ? loading instanceof Function
        ? loading()
        : loading
      : data === null ||
        (data instanceof Array && !data.length) ||
        (data instanceof Map && !data.size)
      ? empty instanceof Function
        ? empty()
        : empty
      : data instanceof Error
      ? error instanceof Function
        ? error(data)
        : error
      : main instanceof Function
      ? main(data as Type)
      : main
  );
}
