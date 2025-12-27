import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

import './App';

@customElement('gc-root')
export class Root extends LitElement {
  static styles = css`
    :host {
      max-width: 480px;
      height: 100%;
      margin-left: auto;
      margin-right: auto;
      display: block;
      position: relative;
    }
  `;

  render() {
    return html`
      <gc-swapp
        accountAddress=${'5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'}
        accountProvider=${'polkadot-js'}
        accountName=${'default'}
        apiAddress="wss://hydration-rpc.n.dwellir.com"
        assetIn="5"
        assetOut="0"
      ></gc-swapp>
    `;
  }
}
