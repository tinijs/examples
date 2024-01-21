import {html} from 'lit';
import {Colors, Scales, registerComponents} from 'tinijs';

import {TiniSpinnerComponent} from '@tinijs/ui/components/spinner';

registerComponents([TiniSpinnerComponent]);

export function loadingPartial() {
  return html`
    <div
      style="
        padding: var(--size-space-2x);
        display: flex;
        justify-content: center;
        max-width: var(--wide-sm);
        margin: auto;
      "
    >
      <tini-spinner scheme=${Colors.Primary} scale=${Scales.LG}></tini-spinner>
    </div>
  `;
}
