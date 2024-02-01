import {html, TemplateResult} from 'lit';

export function oopsPartial({
  message = 'The content you are looking for is not available.',
}: {
  message?: string | TemplateResult;
} = {}) {
  return html`
    <div
      style="
        display: flex;
        flex-direction: column;
        align-items: center;
      "
    >
      <h1>Oops 🫣!</h1>
      <p>${message}</p>
    </div>
  `;
}
