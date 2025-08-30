import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { axiosEW, axiosORS } from './axios';

class ApiWrapper {
  private http: AxiosInstance;

  constructor(instance?: AxiosInstance) {
    this.http = instance || axios.create();
  }

  public setInstance(instance: AxiosInstance) {
    this.http = instance;
  }

  public async get<T>(url: string, params?: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.http.get(url, {
        params,
      });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  public async post<T>(url: string, data?: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.http.post(url, data);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  public async put<T>(url: string, data?: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.http.put(url, data);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  public async delete<T>(url: string): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.http.delete(url);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  private handleError(error: AxiosError): never {
    if (error.response) {
      console.error(
        `API Error: ${error.response.status} - ${error.response.data}`,
      );
      throw new Error(`API Error: ${error.response.status}`);
    } else if (error.request) {
      console.error('No response received from API.');
      throw new Error('No response from API.');
    } else {
      console.error(`Error: ${error.message}`);
      throw new Error(error.message);
    }
  }
}

const orsApi = new ApiWrapper(axiosORS);
const ewApi = new ApiWrapper(axiosEW);

export { orsApi, ewApi };

export default ApiWrapper;
