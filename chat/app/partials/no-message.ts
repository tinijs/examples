import {html, TemplateResult} from 'lit';

import {CommonGradients, Scales, registerComponents} from 'tinijs';

import {IconChatMultipleRegularComponent} from '@tinijs/fluent-icons/chat-multiple-regular';

registerComponents([IconChatMultipleRegularComponent]);

export function noMessagePartial({
  message = 'No message yet!',
}: {
  message?: string | TemplateResult;
} = {}) {
  return html`
    <div style="margin-top: 3rem; text-align: center">
      <icon-chat-multiple-regular
        scheme=${CommonGradients.DiscoClub}
        scale=${Scales.XXXL}
      ></icon-chat-multiple-regular>
      <p style="color: var(--color-medium)">${message}</p>
    </div>
  `;
}
