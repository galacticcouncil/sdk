import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { PolkadotClient } from 'polkadot-api';
import { Subscription } from 'rxjs';

import {
  Asset,
  Amount,
  api as papi,
  big,
  client as c,
  pool,
  sor,
} from '@galacticcouncil/sdk-next';

import { signAndSend } from './signer';
import { humanizeAmount } from './utils';

import { formStyles } from './App.css';

import './element';

@customElement('gc-swapp')
export class Swapp extends LitElement {
  private client: PolkadotClient = null;
  private ctx: pool.PoolContextProvider = null;
  private router: sor.TradeRouter = null;
  private txUtils: sor.TradeUtils = null;

  protected assetClient: c.AssetClient = null;
  protected balanceClient: c.BalanceClient = null;

  protected balanceSub: Subscription = null;

  @property({ type: String }) accountAddress: string = null;
  @property({ type: String }) accountProvider: string = null;
  @property({ type: String }) accountName: string = null;
  @property({ type: String }) apiAddress: string = null;
  @property({ type: Number }) assetIn: number = null;
  @property({ type: Number }) assetOut: number = null;

  @state() trade = {
    assetIn: null as Asset,
    assetOut: null as Asset,
    balanceIn: null as Amount,
    balanceOut: null as Amount,
    current: null as sor.Trade,
  };

  @state() assets = {
    tradeable: [] as Asset[],
    registry: new Map<number, Asset>([]),
    balance: new Map<number, Amount>([]),
  };

  static styles = [formStyles];

  override async firstUpdated() {
    this.client = await papi.getWs(this.apiAddress);
    this.assetClient = new c.AssetClient(this.client);
    this.balanceClient = new c.BalanceClient(this.client);
    this.ctx = new pool.PoolContextProvider(this.client)
      .withOmnipool()
      .withStableswap()
      .withXyk();
    this.router = new sor.TradeRouter(this.ctx);
    this.txUtils = new sor.TradeUtils(this.client);
    this.onLoad();
  }

  private async onLoad() {
    await this.init();
    await this.subscribe();
  }

  private async init() {
    const [tradeable, assets] = await Promise.all([
      this.router.getTradeableAssets(),
      this.assetClient.getOnChainAssets(),
    ]);

    const registry = new Map(assets.map((a) => [a.id, a]));
    this.assets = {
      ...this.assets,
      tradeable: tradeable.map((a) => registry.get(a)),
      registry: registry,
    };
    this.onInit();
  }

  private async onInit() {
    this.initAssets();
  }

  private initAssets() {
    this.trade = {
      ...this.trade,
      assetIn: this.assets.registry.get(this.assetIn),
      assetOut: this.assets.registry.get(this.assetOut),
    };
  }

  private async subscribe() {
    const { balance, registry } = this.assets;
    this.balanceSub = this.balanceClient
      .subscribeBalance(this.accountAddress)
      .subscribe((balances) => {
        balances.forEach(({ id, amount }) => {
          const asset: Asset = registry.get(id);
          if (asset) {
            const newBalance = {
              amount: amount,
              decimals: asset.decimals,
            } as Amount;
            balance.set(id, newBalance);
          }
        });
        this.assets.balance = balance;
        this.onBalanceUpdate();
      });
  }

  private async onBalanceUpdate() {
    console.log('Balance sync');
    this.trade = {
      ...this.trade,
      balanceIn: this.assets.balance.get(this.assetIn),
      balanceOut: this.assets.balance.get(this.assetOut),
    };
  }

  private async onCtaClick() {
    const { current } = this.trade;

    let tx;

    if (current && current.type === sor.TradeType.Sell) {
      tx = await this.txUtils.buildSellTx(current);
    }

    if (current && current.type === sor.TradeType.Buy) {
      tx = await this.txUtils.buildBuyTx(current);
    }

    if (tx) {
      const subscription = await signAndSend(
        this.accountProvider,
        this.accountAddress,
        this.client,
        tx,
        (e) => console.log(e)
      );
    }

    console.log('Unknown ops');
  }

  private isEmptyAmount(amount: string): boolean {
    return amount == null || amount == '' || amount == '0';
  }

  private async updateAmountIn(amount: string) {
    if (this.isEmptyAmount(amount)) {
      this.trade = {
        ...this.trade,
        current: null,
      };
      return;
    }

    const { assetIn, assetOut } = this.trade;
    this.trade.current = await this.router.getBestSell(
      assetIn.id,
      assetOut.id,
      amount
    );
    this.requestUpdate();
  }

  private async updateAmountOut(amount: string) {
    if (this.isEmptyAmount(amount)) {
      this.trade = {
        ...this.trade,
        current: null,
      };
      return;
    }

    const { assetIn, assetOut } = this.trade;
    this.trade.current = await this.router.getBestBuy(
      assetIn.id,
      assetOut.id,
      amount
    );
    this.requestUpdate();
  }

  private onAssetInputChange(e: CustomEvent) {
    const { id, value } = e.detail;
    id == 'assetIn' && this.updateAmountIn(value);
    id == 'assetOut' && this.updateAmountOut(value);
  }

  override connectedCallback() {
    super.connectedCallback();
  }

  override disconnectedCallback() {
    this.balanceSub.unsubscribe();
    this.ctx.destroy();
    this.client.destroy();
    super.disconnectedCallback();
  }

  formAssetTemplate(asset: Asset) {
    if (asset) {
      return html`
        <gc-asset-identicon
          slot="asset"
          .asset=${asset}
          .assets=${this.assets}
        ></gc-asset-identicon>
      `;
    }
  }

  formAssetBalanceTemplate(balance: Amount) {
    return html`
      <uigc-asset-balance
        slot="balance"
        .balance=${balance && big.toDecimal(balance.amount, balance.decimals)}
        .visible=${false}
        .formatter=${humanizeAmount}
      ></uigc-asset-balance>
    `;
  }

  formAssetInTemplate() {
    const { assetIn, balanceIn, current } = this.trade;

    let amount = '0';
    if (current) {
      const { amountIn } = current.toHuman();
      amount = amountIn;
    }

    return html`
      <uigc-asset-transfer
        id="assetIn"
        title=${'Pay With'}
        .asset=${assetIn?.symbol}
        .amount=${amount}
      >
        ${this.formAssetTemplate(assetIn)}
        ${this.formAssetBalanceTemplate(balanceIn)}
      </uigc-asset-transfer>
    `;
  }

  formAssetOutTemplate() {
    const { assetOut, balanceOut, current } = this.trade;

    let amount = '0';
    if (current) {
      const { amountOut } = current.toHuman();
      amount = amountOut;
    }

    return html`
      <uigc-asset-transfer
        id="assetOut"
        title=${'You Get'}
        .asset=${assetOut?.symbol}
        .amount=${amount}
      >
        ${this.formAssetTemplate(assetOut)}
        ${this.formAssetBalanceTemplate(balanceOut)}
      </uigc-asset-transfer>
    `;
  }

  render() {
    return html`
      <uigc-paper @asset-input-change=${this.onAssetInputChange}>
        <div class="header">
          <uigc-typography variant="title">Trade assets</uigc-typography>
        </div>
        <div class="transfer">
          ${this.formAssetInTemplate()} ${this.formAssetOutTemplate()}
        </div>
        <uigc-button
          ?disabled=${!this.trade.current}
          class="confirm"
          variant="primary"
          fullWidth
          @click=${this.onCtaClick}
        >
          SWAP
        </uigc-button>
      </uigc-paper>
    `;
  }
}
