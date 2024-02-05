import {html, nothing, css} from 'lit';
import {unsafeHTML} from 'lit/directives/unsafe-html';
import {ref, Ref, createRef} from 'lit/directives/ref';

import {
  Page,
  TiniComponent,
  Inject,
  OnInit,
  OnReady,
  Reactive,
  render,
  RenderData,
} from '@tinijs/core';
import {
  OnBeforeEnter,
  UseRouter,
  Router,
  UseParams,
  FragmentItem,
} from '@tinijs/router';

import {TiniGenericComponent} from '@tinijs/ui/components/generic';
import {TiniBoxComponent} from '@tinijs/ui/components/box';

import {Post, PostContentService} from '../consts/post-content';

import {oopsPartial} from '../partials/oops';

@Page({
  name: 'app-page-post',
  components: [TiniGenericComponent, TiniBoxComponent],
})
export class AppPagePost
  extends TiniComponent
  implements OnInit, OnBeforeEnter, OnReady
{
  @Inject() readonly postContentService!: PostContentService;
  @UseRouter() readonly router!: Router;
  @UseParams() readonly params!: {slug: string};

  @Reactive() post: RenderData<Post>;
  @Reactive() fragments: FragmentItem[] = [];

  readonly contentRef: Ref<HTMLDivElement> = createRef();

  onBeforeEnter(...params: any[]) {
    console.log('Post: ', this, params);
  }

  async onInit() {
    try {
      this.post = await this.postContentService.getBySlug(this.params.slug);
    } catch (error) {
      this.post = null;
    }
  }

  onReady() {
    if (this.contentRef.value) {
      this.fragments = this.router
        .renewFragments(this.contentRef.value, {delay: 500})
        .retrieveFragments();
      console.log('Fragments: ', this.fragments);
    }
  }

  protected render() {
    return render([this.post], {
      empty: () => this.notFoundTemplate,
      main: () => this.mainTemplate,
    });
  }

  private get notFoundTemplate() {
    return oopsPartial({
      message: html`Page not found: <strong>${this.params.slug}</strong>`,
    });
  }

  private get mainTemplate() {
    return !this.post
      ? nothing
      : html`
          <article>
            <div><img src=${this.post.image} /></div>
            <h1>${this.post.title}</h1>
            <div><strong>${this.post.excerpt}</strong></div>
            ${!this.fragments
              ? nothing
              : html`
                  <div>
                    <p><strong>In this page</strong></p>
                    <ul>
                      ${this.fragments.map(
                        ({id, title}) => html`
                          <li>
                            <a href=${`#${id}`}>${title}</a>
                          </li>
                        `
                      )}
                    </ul>
                  </div>
                `}
            <div ${ref(this.contentRef)}>${unsafeHTML(this.post.content)}</div>
          </article>
        `;
  }

  static styles = [
    css`
      article {
        width: var(--wide-md);

        picture,
        img {
          width: 100%;
          height: auto;
        }
      }
    `,
    css`
      code[class*='language-'],
      pre[class*='language-'] {
        color: #f8f8f2;
        background: none;
        font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
        text-align: left;
        white-space: pre;
        word-spacing: normal;
        word-break: normal;
        word-wrap: normal;
        line-height: 1.5;

        -moz-tab-size: 4;
        -o-tab-size: 4;
        tab-size: 4;

        -webkit-hyphens: none;
        -moz-hyphens: none;
        -ms-hyphens: none;
        hyphens: none;
      }

      /* Code blocks */
      pre[class*='language-'] {
        padding: 1em;
        margin: 0.5em 0;
        overflow: auto;
        border-radius: 0.3em;
      }

      :not(pre) > code[class*='language-'],
      pre[class*='language-'] {
        background: #2b2b2b;
      }

      /* Inline code */
      :not(pre) > code[class*='language-'] {
        padding: 0.1em;
        border-radius: 0.3em;
        white-space: normal;
      }

      .token.comment,
      .token.prolog,
      .token.doctype,
      .token.cdata {
        color: #d4d0ab;
      }

      .token.punctuation {
        color: #fefefe;
      }

      .token.property,
      .token.tag,
      .token.constant,
      .token.symbol,
      .token.deleted {
        color: #ffa07a;
      }

      .token.boolean,
      .token.number {
        color: #00e0e0;
      }

      .token.selector,
      .token.attr-name,
      .token.string,
      .token.char,
      .token.builtin,
      .token.inserted {
        color: #abe338;
      }

      .token.operator,
      .token.entity,
      .token.url,
      .language-css .token.string,
      .style .token.string,
      .token.variable {
        color: #00e0e0;
      }

      .token.atrule,
      .token.attr-value,
      .token.function {
        color: #ffd700;
      }

      .token.keyword {
        color: #00e0e0;
      }

      .token.regex,
      .token.important {
        color: #ffd700;
      }

      .token.important,
      .token.bold {
        font-weight: bold;
      }

      .token.italic {
        font-style: italic;
      }

      .token.entity {
        cursor: help;
      }

      @media screen and (-ms-high-contrast: active) {
        code[class*='language-'],
        pre[class*='language-'] {
          color: windowText;
          background: window;
        }

        :not(pre) > code[class*='language-'],
        pre[class*='language-'] {
          background: window;
        }

        .token.important {
          background: highlight;
          color: window;
          font-weight: normal;
        }

        .token.atrule,
        .token.attr-value,
        .token.function,
        .token.keyword,
        .token.operator,
        .token.selector {
          font-weight: bold;
        }

        .token.attr-value,
        .token.comment,
        .token.doctype,
        .token.function,
        .token.keyword,
        .token.operator,
        .token.property,
        .token.string {
          color: highlight;
        }

        .token.attr-value,
        .token.url {
          font-weight: normal;
        }
      }
    `,
  ];
}
