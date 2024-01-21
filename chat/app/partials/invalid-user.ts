import {html, TemplateResult} from 'lit';

import {CommonGradients, Scales, registerComponents} from 'tinijs';

import {IconPersonQuestionMarkRegularComponent} from '@tinijs/fluent-icons/person-question-mark-regular';

registerComponents([IconPersonQuestionMarkRegularComponent]);

export function invalidUserPartial({
  message = 'User not found!',
}: {
  message?: string | TemplateResult;
} = {}) {
  return html`
    <div
      style="
        padding: var(--size-space-2x);
        text-align: center;
      "
    >
      <icon-person-question-mark-regular
        scheme=${CommonGradients.DiscoClub}
        scale=${Scales.XXXL}
      ></icon-person-question-mark-regular>
      <p style="color: var(--color-medium)">${message}</p>
    </div>
  `;
}
