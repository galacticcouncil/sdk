import {
  OcelloidsSseClient,
  OcelloidsHttpClient,
  XcStore,
} from '@galacticcouncil/xc-scan';

const apiUrl = 'https://api.ocelloids.net';
const apiKey =
  'eyJhbGciOiJFZERTQSIsImtpZCI6Im92SFVDU3hRM0NiYkJmc01STVh1aVdjQkNZcDVydmpvamphT2J4dUxxRDQ9In0.ewogICJpc3MiOiAiYXBpLm9jZWxsb2lkcy5uZXQiLAogICJqdGkiOiAiMDEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAiLAogICJzdWIiOiAicHVibGljQG9jZWxsb2lkcyIKfQo.qKSfxo6QYGxzv40Ox7ec6kpt2aVywKmhpg6lue4jqmZyY6y3SwfT-DyX6Niv-ine5k23E0RKGQdm_MbtyPp9CA';

const httpClient = new OcelloidsHttpClient(apiUrl, apiKey);
const sseClient = new OcelloidsSseClient(apiUrl);
const xcStore = new XcStore(httpClient, sseClient);

function subscribeStore(address: string) {
  xcStore.subscribe(address, {
    onLoad(j) {
      console.log('History:', j);
    },
    onNew(j) {
      console.log('New:', j);
    },
    onUpdate(j, p) {
      console.log('Updated:', j, p);
    },
    onOpen() {
      console.log('Live stream started...');
    },
    onError(err) {
      console.error('Live stream error', err);
    },
  });
}

// subscribe

subscribeStore('13b6hRRYPHTxFzs9prvL2YGHQepvd4YhdDb9Tc7khySp3hMN');
