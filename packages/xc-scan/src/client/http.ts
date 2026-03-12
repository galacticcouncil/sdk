import { XcJourneyRequest, XcJourneyResponse, XcPagination } from './types';

export class OcelloidsHttpClient {
  private _baseUrl: string;
  private _apiKey: string;

  public constructor(baseUrl: string, apiKey: string) {
    this._baseUrl = baseUrl;
    this._apiKey = apiKey;
  }

  async queryCrosschain(
    args: XcJourneyRequest,
    pagination: XcPagination
  ): Promise<XcJourneyResponse> {
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
      body: JSON.stringify({
        args: args,
        pagination: pagination,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Query XC failed: ${response.status} ${text}`);
    }

    const resp = await response.json();
    return resp as XcJourneyResponse;
  }
}
