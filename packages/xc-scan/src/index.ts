import { OcelloidsSseClient, OcelloidsHttpClient } from './client';
import { XcStore } from './store';

const apiUrl = 'https://api.ocelloids.net';
const apiKey =
  'eyJhbGciOiJFZERTQSIsImtpZCI6Im92SFVDU3hRM0NiYkJmc01STVh1aVdjQkNZcDVydmpvamphT2J4dUxxRDQ9In0.ewogICJpc3MiOiAiYXBpLm9jZWxsb2lkcy5uZXQiLAogICJqdGkiOiAiMDEwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAiLAogICJzdWIiOiAicHVibGljQG9jZWxsb2lkcyIKfQo.qKSfxo6QYGxzv40Ox7ec6kpt2aVywKmhpg6lue4jqmZyY6y3SwfT-DyX6Niv-ine5k23E0RKGQdm_MbtyPp9CA';

const httpClient = new OcelloidsHttpClient(apiUrl, apiKey);
const sseClient = new OcelloidsSseClient(apiUrl);

const store = new XcStore(httpClient, sseClient);

await store.subscribeByAddress('0x8335459a89A17Ed8ed128aa98F9AF86802DACF30', {
  onNewJourney(j) {
    console.log('New journey:', j);
  },
  onUpdateJourney(j) {
    console.log('Updated journey:', j);
  },
  onOpen() {
    console.log('SSE open');
  },
  onError(err) {
    console.error('XC error', err);
  },
});
