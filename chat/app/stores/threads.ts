import {RenderData} from '@tinijs/core';
import {createStore} from '@tinijs/store';
import {once} from '@tinijs/toolbox/common';

import {Thread} from '../types/thread';

import {ThreadService} from '../services/thread';

export const threadsStore = createStore({
  list: undefined as RenderData<Map<string, Thread>>,
});

export const streamThreadList = once((threadService: ThreadService) =>
  threadService.streamList(({data}) => {
    // console.log('streamThreadList ->', data?.id);
    if (!data) {
      if (threadsStore.list) return;
      return threadsStore.commit('list', null);
    }
    const list = threadsStore.list || new Map<string, Thread>();
    return threadsStore.commit('list', list.set(data.id, data));
  })
);
