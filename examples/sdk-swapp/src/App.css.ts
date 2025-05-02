import { css } from 'lit';

export const formStyles = css`
  :host {
    display: flex;
    flex-direction: column;
    height: 100%;
    max-width: 500px;
  }

  .header {
    box-sizing: border-box;
    align-items: center;
    min-height: 84px;
    padding: 22px 28px;
    display: flex;
    position: relative;
  }

  .transfer {
    display: flex;
    position: relative;
    flex-direction: column;
    padding: 0 14px;
    gap: 14px;
    box-sizing: border-box;
  }

  @media (max-width: 480px) {
    .transfer {
      padding: 0;
    }
  }

  @media (min-width: 768px) {
    .transfer {
      padding: 0 28px;
    }
  }

  .transfer .divider {
    background: var(--uigc-divider-background);
    height: 1px;
    width: 100%;
    left: 0;
    position: absolute;
  }

  .info .route-label {
    background: var(--uigc-app-font-color__gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 500;
    font-size: 12px;
    line-height: 100%;
    text-align: center;
  }

  .info .route-icon {
    margin-left: 12px;
  }

  .info uigc-icon-chevron-right {
    width: 22px;
    height: 22px;
  }

  .info uigc-icon-route {
    margin-left: 12px;
  }

  .cta {
    overflow: hidden;
    width: 100%;
    height: 50px;
    margin: -16px;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }

  .cta > span {
    position: absolute;
    transition: top 0.3s;
    -moz-transition: top 0.3s;
    -webkit-transition: top 0.3s;
    -o-transition: top 0.3s;
    -ms-transition: top 0.3s;
  }

  .cta > span.swap {
    top: 16px;
  }

  .cta > span.twap {
    top: 56px;
  }

  .cta__twap > span.swap {
    top: -56px;
  }

  .cta__twap > span.twap {
    top: 16px;
  }

  .hidden {
    display: none;
  }

  .confirm {
    display: flex;
    padding: 11px 14px 22px 14px;
    box-sizing: border-box;
  }

  @media (min-width: 768px) {
    .confirm {
      padding: 11px 28px 22px 28px;
    }
  }
`;
