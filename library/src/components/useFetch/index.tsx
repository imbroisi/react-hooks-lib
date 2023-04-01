import { useEffect, useState } from 'react';

type Params = { [key: string]: unknown};
type HttpErrorType = { name: string };
interface ApiReturnType {
  httpError?: HttpErrorType,
  response?: unknown,
  headers?: Headers,
}

/**
 * The return of the api is ALWAYS an object
 *
 * Returns:
 *
 * SUCCESS:
 * {
 *   response,          // the api response
 *   headers,           // the http response headers as Headers object
 * }
 *
 * FAIL:
 * {
 *   httpError,   // the http error
 * }
 */
export const apiCall = async (url: string, params?: Params): Promise<ApiReturnType> => {
  let response;
  let headers;

  try {
    const res = await fetch(url, params);
    headers = res.headers;
    response = await res.json();
  } catch (e) {
    const httpError = e as HttpErrorType;
    return { httpError };
  }

  return { response, headers };
};

/**
 * Returns:
 *
 * Loading:
 * {
 *    response: undefined,
 *    httpError: undefined
 * }
 *
 * SUCCESS:
 * {
 *   response,          // the api response
 *   headers,           // the http response headers
 * }
 *
 * FAIL:
 * {
 *   httpError,   // the http error
 * }
 *
 */

export const useFetch = (url: string, params: Params = {}): ApiReturnType => {
  const [ret, setRet] = useState<ApiReturnType>({});

  useEffect(() => {
    if (!url) {
      return;
    }

    // to cancel the api call if user leaves the page before the response
    const controller = new AbortController();

    (async () => {
      const apiRet: ApiReturnType = await apiCall(url, {
        signal: controller.signal,
        ...params,
      });

      // 'AbortError' means that api call was canceled by controller.abort()
      // in the component unmounting process (see bellow)
      const { httpError } = apiRet;

      if (!httpError || httpError.name !== 'AbortError') {
        setRet(apiRet);
      }
    })();

    return () => {
      // component unmounting, cancel pending api call
      if (url) {
        controller.abort();
      }
    };
  }, []);

  return ret;
};
