import axios, { AxiosInstance } from 'axios';
import Coordinate from '../models/Coordinate';

/**
 * POIService provides methods to fetch Points of Interest (POIs) using OpenRouteService API.
 */
export class POIService {
  private client: AxiosInstance = axios.create();
  private ORS_KEY: string = process.env.ORS_KEY as string;
  private openRouteServiceBaseUrl: string = 'http://localhost:8080/pois';
  // 'https://api.openrouteservice.org/pois';

  /**
   * Creates an instance of POIService.
   * @throws Will throw an error if the OpenRouteService API key is not set.
   */
  constructor() {
    if (!this.ORS_KEY) {
      throw new Error('Cannot fetch OpenRouteService API key!');
    }
  }

  /**
   * Fetches standard POIs for a given start and end coordinate within a buffer distance.
   * @param start The starting coordinate.
   * @param end The ending coordinate.
   * @param buffer The buffer distance for POI search. Default is 250.
   * @returns A promise that resolves to a JSON string containing POI data.
   */
  public async getPOIsStandard(
    start: Coordinate,
    end: Coordinate,
    buffer: number = 250,
  ): Promise<string> {
    const json = {
      request: 'pois',
      geometry: {
        bbox: [
          [start.longitude, start.latitude],
          [end.longitude, end.latitude],
        ],
        geojson: {
          type: 'Point',
          coordinates: [start.longitude, start.latitude],
        },
        buffer: buffer,
      },
    };

    const response = await this.client
      .post(`${this.openRouteServiceBaseUrl}?api_key=${this.ORS_KEY}`, json, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .catch((error) => {
        console.error('POI_error:', error?.response?.data);
        throw new Error(`POI_error: ${error?.response?.data}`);
      })
      .then((response) => {
        return JSON.stringify(response.data);
      });

    return response;
  }

  /**
   * Fetches the list of POI categories from OpenRouteService API.
   * @returns A promise that resolves to a dictionary containing POI categories.
   */
  public async getPOICategories(): Promise<Record<string, any>> {
    const json = {
      request: 'list',
    };

    const response = await this.client.post(
      `${this.openRouteServiceBaseUrl}?api_key=${this.ORS_KEY}`,
      json,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error(`Error getting POI categories: ${response.status}`);
    }
  }
}
