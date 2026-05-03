import { GLOBAL_CONFIG } from '#src/config.js';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

type HttpResult<T> = 
  | { ok: true; data: T; response: AxiosResponse<T> }
  | { ok: false; error: AxiosError }

interface HttpClientOptions {
  baseURL: string;
  token?: string;
  timeout?: number;
}

export function createHttpClient({ baseURL, token, timeout }: HttpClientOptions) {
  const instance = axios.create({
    baseURL,
    timeout: timeout ?? 30_000,
    headers: token ? { Authorization: token } : {},
  });

  async function get<T>(url: string, config?: AxiosRequestConfig): Promise<HttpResult<T>> {
    try {
      const response = await instance.get<T>(url, config);
      return { ok: true, data: response.data, response };
    } catch (error) {
      return { ok: false, error: error as AxiosError };
    }
  }

  async function post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<HttpResult<T>> {
    try {
      const response = await instance.post<T>(url, body, config);
      return { ok: true, data: response.data, response };
    } catch (error) {
      return { ok: false, error: error as AxiosError };
    }
  }

  async function postStream(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<HttpResult<NodeJS.ReadableStream>> {
    try {
      const response = await instance.post(url, body, { ...config, responseType: 'stream', timeout: 0 });
      return { ok: true, data: response.data as NodeJS.ReadableStream, response };
    } catch (error) {
      return { ok: false, error: error as AxiosError };
    }
  }

  return { get, post, postStream, instance };
}

export const llmManage = createHttpClient({
  baseURL: GLOBAL_CONFIG.LLM.PROVIDER.URL,
  token: GLOBAL_CONFIG.LLM.PROVIDER.TOKEN
})

const llmBase = axios.create({
  baseURL: GLOBAL_CONFIG.LLM.PROVIDER.URL,
  timeout: 30_000,
});

export function createLLMClient(token: string) {
  const headers = { Authorization: `Bearer ${token}` };

  async function post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<HttpResult<T>> {
    try {
      const response = await llmBase.post<T>(url, body, { ...config, headers: { ...headers, ...config?.headers } });
      return { ok: true, data: response.data, response };
    } catch (error) {
      return { ok: false, error: error as AxiosError };
    }
  }

  async function postStream(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<HttpResult<NodeJS.ReadableStream>> {
    try {
      const response = await llmBase.post(url, body, { ...config, headers: { ...headers, ...config?.headers }, responseType: 'stream', timeout: 0 });
      return { ok: true, data: response.data as NodeJS.ReadableStream, response };
    } catch (error) {
      return { ok: false, error: error as AxiosError };
    }
  }

  return { post, postStream };
}
