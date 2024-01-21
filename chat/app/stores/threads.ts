import {createStore} from '@tinijs/store';

import {Thread} from '../types/thread';

import {once} from '../helpers/common';
import {ChunkData} from '../helpers/render';

import {ThreadsService} from '../services/threads';

export const threadsStore = createStore({
  list: undefined as ChunkData<Map<string, Thread>>,
});

export const streamThreadList = once((threadsService: ThreadsService) =>
  threadsService.streamList(({data}) => {
    // console.log('streamThreadList ->', data?.id);
    if (!data) {
      if (threadsStore.list) return;
      return threadsStore.commit('list', null);
    }
    const list = threadsStore.list || new Map<string, Thread>();
    return threadsStore.commit('list', list.set(data.id, data));
  })
);
