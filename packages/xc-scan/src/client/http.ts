import { XcJourney, XcJourneyRequest } from './types';

export class OcelloidsHttpClient {
  private _baseUrl: string;
  private _apiKey: string;

  public constructor(baseUrl: string, apiKey: string) {
    this._baseUrl = baseUrl;
    this._apiKey = apiKey;
  }

  async queryCrosschain(request: XcJourneyRequest): Promise<XcJourney[]> {
    const headers = Object.assign(
      {
        'Content-Type': 'application/json',
      },
      { Authorization: `Bearer ${this._apiKey}` }
    );

    const queryUrl = `${this._baseUrl}/query/crosschain`;
    const response = await fetch(queryUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Response status: ${response.status} ${text}`);
    }

    const resp = await response.json();
    return resp as XcJourney[];
  }
}
