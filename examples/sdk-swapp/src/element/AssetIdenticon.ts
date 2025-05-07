import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';

import { Asset, const as c } from '@galacticcouncil/sdk-next';
import { MetadataStore } from '@galacticcouncil/ui';

@customElement('gc-asset-identicon')
export class AssetIdenticon extends LitElement {
  @property({ type: Boolean }) showDesc: boolean = false;
  @property({ type: Boolean }) showSymbol: boolean = true;
  @property({ attribute: false }) asset: Asset = null;
  @property({ attribute: false }) assets: Map<number, Asset> = new Map([]);

  @state() whitelist: string[] = [];

  override async firstUpdated() {
    this.whitelist = await MetadataStore.getInstance().externalWhitelist();
  }

  iconTemplate(id: number) {
    return html`
      <uigc-asset-id
        slot="icon"
        ecosystem=${'polkadot'}
        chain=${2034}
        .asset=${id.toString()}
      >
      </uigc-asset-id>
    `;
  }

  render() {
    const { id, name, symbol, meta, type } = this.asset || {};
    if (meta) {
      const icons = Object.entries(meta);
      return html`
        <uigc-asset
          ?icon=${!this.showSymbol}
          symbol=${symbol}
          desc=${this.showDesc ? name : null}
        >
          ${map(icons, ([key]) => {
            return this.iconTemplate(Number(key));
          })}
        </uigc-asset>
      `;
    }

    if (type === 'Bond') {
      return html`
        <uigc-asset
          ?icon=${!this.showSymbol}
          symbol=${symbol}
          desc=${this.showDesc ? name : name.replace('HDX Bond', '').trim()}
        >
          ${this.iconTemplate(c.SYSTEM_ASSET_ID)}
        </uigc-asset>
      `;
    }

    return html`
      <uigc-asset
        ?icon=${!this.showSymbol}
        symbol=${symbol}
        desc=${this.showDesc ? name : null}
      >
        ${this.iconTemplate(id)}
      </uigc-asset>
    `;
  }
}
