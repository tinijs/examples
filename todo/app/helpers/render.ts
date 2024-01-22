import {TemplateResult, nothing} from 'lit';
import {cache} from 'lit/directives/cache';

export type ChunkData<Type> = Type | null | undefined;

export type ChunkDataOrError<Type> = ChunkData<Type> | Error;

export type ChunkTemplateResult = TemplateResult | typeof nothing;

enum Statuses {
  Loading = 'loading',
  Empty = 'empty',
  Error = 'error',
  Fulfilled = 'fulfilled',
}

export interface ChunkTemplates<Type> {
  main: (dependencies: ChunkDataOrError<unknown>[]) => ChunkTemplateResult;
  loading?: () => ChunkTemplateResult;
  empty?: () => ChunkTemplateResult;
  error?: (dependencies: ChunkDataOrError<unknown>[]) => ChunkTemplateResult;
}

export function renderChunk<Type>(
  dependencies: ChunkDataOrError<unknown>[],
  templates: ChunkTemplates<Type>
) {
  const main = templates.main;
  const loading = templates.loading || nothing;
  const empty = templates.empty || nothing;
  const error = templates.error || nothing;
  // check status
  const status = dependencies.every(item => item === undefined)
    ? Statuses.Loading
    : dependencies.every(
        item =>
          item === null ||
          (item instanceof Array && !item.length) ||
          (item instanceof Map && !item.size) ||
          (item instanceof Object && !Object.keys(item).length)
      )
    ? Statuses.Empty
    : dependencies.some(item => item instanceof Error)
    ? Statuses.Error
    : Statuses.Fulfilled;
  // render
  return cache(
    status === Statuses.Loading
      ? loading instanceof Function
        ? loading()
        : loading
      : status === Statuses.Empty
      ? empty instanceof Function
        ? empty()
        : empty
      : status === Statuses.Error
      ? error instanceof Function
        ? error(dependencies)
        : error
      : status === Statuses.Fulfilled
      ? main(dependencies)
      : main
  );
}
