import axios, { AxiosInstance } from 'axios';
import Coordinate from '../models/Coordinate';
import { BacktrackingService } from './BacktrackingService';

/**
 * POIService provides methods to fetch Points of Interest (POIs) using OpenRouteService API.
 */
export class POIService {
    private client: AxiosInstance = axios.create();
    private ORS_KEY: string = process.env.ORS_KEY as string;
    private openRouteServiceBaseUrl: string =
        'https://api.openrouteservice.org/pois';
    private seachBaseUrl: string =
        'https://api.openrouteservice.org/geocode/search';
    private matrixBaseUrl: string =
        'https://api.openrouteservice.org/v2/matrix/driving-car';
    private backtrackingService: BacktrackingService;

    /**
     * Creates an instance of POIService.
     * @throws Will throw an error if the OpenRouteService API key is not set.
     */
    constructor() {
        if (!this.ORS_KEY) {
            throw new Error('Cannot fetch OpenRouteService API key!');
        }
        this.backtrackingService = new BacktrackingService();
    }

    public async getPOIsStandard(
        start: Coordinate,
        end: Coordinate,
        buffer: number = 250,
        categoryIds?: number[],
        categoryGroupIds?: number[],
    ): Promise<string> {
        const isCategoriesNotEmtpy = categoryIds && categoryIds.length > 0;
        const isCategoryGroupsNotEmpty =
            categoryGroupIds && categoryGroupIds.length > 0;

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
            ...(isCategoriesNotEmtpy && {
                filters: { category_ids: categoryIds },
            }),
            ...(isCategoryGroupsNotEmpty && {
                filters: { category_group_ids: categoryGroupIds },
            }),
        };

        const response = await this.client
            .post(
                `${this.openRouteServiceBaseUrl}?api_key=${this.ORS_KEY}`,
                json,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            )
            .catch((error) => {
                console.error('POI_error:', error?.response?.data);
                throw new Error(`POI_error: ${error?.response?.data}`);
            })
            .then(async (response) => {
                const pois = this.extractPointsFromResponse(
                    JSON.stringify(response.data),
                );

                const poiMetadata = this.extractPOIMetadata(response.data);

                // Add start and end metadata placeholders
                poiMetadata.unshift({ category: null, subCategory: null });
                poiMetadata.push({ category: null, subCategory: null });

                let responseData;
                if (typeof response?.data === 'string') {
                    const sanitizedString = response?.data.replace(
                        /\bNaN\b/g,
                        'null',
                    );
                    responseData = JSON.parse(sanitizedString);
                } else {
                    responseData = response?.data;
                }

                const enhancedResponse = {
                    ...responseData,
                    pois,
                    poiMetadata,
                    poiVisitDurations: poiMetadata.map((meta, index) => ({
                        poiIndex: index,
                        visitDuration:
                            meta.category && meta.subCategory
                                ? this.backtrackingService.getVisitDuration(
                                      meta.category,
                                      meta.subCategory,
                                  )
                                : 0,
                    })),
                };

                return JSON.stringify(enhancedResponse);
            });

        return response;
    }

    /**
     * Finds the minimum time route between points of interest using backtracking algorithm.
     * @param pois Array of coordinates representing points of interest
     * @param poiMetadata Metadata for each POI including category information
     * @returns A promise that resolves to an object containing the optimal route and matrices
     */
    public async findMinimumRouteBt(
        pois: Coordinate[],
        poiMetadata: Array<{
            category?: string | null;
            subCategory?: string | null;
        }>,
    ): Promise<{
        optimalRoute: any;
        matrices: {
            distance: number[][];
            duration: number[][];
        };
    }> {
        if (pois.length < 2) {
            throw new Error(
                'At least start and end points are required for route calculation',
            );
        }

        const { distanceMatrix, durationMatrix } = await this.getRouteMatrices(
            pois,
        );

        const optimalRoute = await this.backtrackingService.findMinimumRouteBt(
            pois,
            poiMetadata,
        );

        return {
            optimalRoute,
            matrices: {
                distance: distanceMatrix,
                duration: durationMatrix,
            },
        };
    }

    /**
     * Extracts metadata including category information from POI response
     * @param responseData The response data from the POI API
     * @returns Array of metadata objects containing category information
     */
    private extractPOIMetadata(
        responseData: any,
    ): Array<{ category?: string | null; subCategory?: string | null }> {
        const metadata = [];

        try {
            const features = responseData?.features || [];

            for (const feature of features) {
                const categoryIds = feature?.properties?.category_ids || {};
                const firstCategoryId = Object.keys(categoryIds)[0];
                const properties = categoryIds[firstCategoryId] || {};
                const category = properties?.category_group;
                const subCategory = properties?.category_name;

                metadata.push({
                    category,
                    subCategory,
                });
            }
        } catch (error) {
            console.error('Error extracting POI metadata:', error);
        }

        return metadata;
    }

    /**
     * Gets the distance and duration matrices for a set of coordinates.
     * @param coordinates Array of coordinates to calculate matrices for
     * @returns An object containing distance and duration matrices
     */
    private async getRouteMatrices(coordinates: Coordinate[]): Promise<{
        distanceMatrix: number[][];
        durationMatrix: number[][];
    }> {
        if (coordinates.length < 2)
            return {
                distanceMatrix: [],
                durationMatrix: [],
            };

        const payloadCoords = coordinates.map((coord) => [
            coord.longitude,
            coord.latitude,
        ]);

        const jsonContent = {
            locations: payloadCoords,
            metrics: ['distance', 'duration'],
        };

        const response = await this.client
            .post(this.matrixBaseUrl, jsonContent, {
                headers: {
                    Authorization: this.ORS_KEY,
                    'Content-Type': 'application/json',
                },
            })
            .catch((error) => {
                console.error('Matrix_error:', error?.response?.data);
                throw new Error(`Matrix_error: ${error?.response?.data}`);
            });

        return {
            distanceMatrix: response.data.distances,
            durationMatrix: response.data.durations,
        };
    }

    /**
     * Extracts coordinates from a JSON response.
     * @param jsonString The JSON string containing POI data.
     * @returns An array of coordinates.
     */
    private extractPointsFromResponse(jsonString: string): Coordinate[] {
        try {
            const featureCollection = JSON.parse(jsonString);
            const points: Coordinate[] = [];

            if (!featureCollection.features) {
                return points;
            }

            for (const feature of featureCollection?.features) {
                const coordinates = feature?.geometry?.coordinates;
                points.push(new Coordinate(coordinates?.[1], coordinates?.[0]));
            }

            return points;
        } catch (error) {
            console.error('Parse_error:', error);
            throw new Error(`Parse_error: ${error}`);
        }
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

    /**
     * Searches for POIs based on a text query.
     * @returns A promise that resolves to a dictionary containing POI search results.
     */
    public async search(text: string): Promise<any> {
        const response = await this.client
            .get(
                `${this.seachBaseUrl}?api_key=${this.ORS_KEY}&text=${text}&boundary.country=RO&boundary.rect.min_lon=24.50003&boundary.rect.min_lat=46.50714&boundary.rect.max_lon=24.61487&boundary.rect.max_lat=46.56453`,
            )
            .catch((error) => {
                console.error('POI_error:', error);
                throw new Error(`POI_error: ${error}`);
            });

        if (response.status === 200) {
            return response.data;
        } else {
            throw new Error(`Error getting POI categories: ${response.status}`);
        }
    }
}
