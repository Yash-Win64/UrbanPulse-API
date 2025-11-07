import requests
import time
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class APIClient:
    def __init__(self, base_url, headers=None, retries=3, backoff_factor=2, timeout=10):
        self.base_url = base_url
        self.headers = headers or {}
        self.retries = retries
        self.backoff_factor = backoff_factor
        self.timeout = timeout

    def get(self, endpoint, params=None, expected_keys=None):
        return self._request("GET", endpoint, params=params, expected_keys=expected_keys)

    def post(self, endpoint, data=None, json=None, expected_keys=None):
        return self._request("POST", endpoint, data=data, json=json, expected_keys=expected_keys)

    def _request(self, method, endpoint, **kwargs):
        params = kwargs.get('params')
        data = kwargs.get('data')
        json_payload = kwargs.get('json')
        expected_keys = kwargs.get('expected_keys', [])

        url = f"{self.base_url}{endpoint}"
        attempt = 0

        while attempt < self.retries:
            try:
                response = requests.request(
                    method,
                    url,
                    headers=self.headers,
                    params=params,
                    data=data,
                    json=json_payload,
                    timeout=self.timeout
                )

                if response.status_code == 200:
                    res_json = response.json()
                    if expected_keys and not set(expected_keys).issubset(res_json.keys()):
                        logging.warning(f"Unexpected response structure: {res_json}")
                    return res_json
                elif response.status_code == 403:
                    logging.error("Forbidden: Check API key or permissions.")
                    return None
                elif response.status_code == 404:
                    logging.error(f"Endpoint not found: {url}")
                    return None
                elif response.status_code == 429:
                    wait = self.backoff_factor ** attempt
                    logging.warning(f"Rate limited. Retrying in {wait} sec...")
                    time.sleep(wait)
                    attempt += 1
                else:
                    logging.error(f"HTTP {response.status_code}: {response.text}")
                    return None

            except requests.exceptions.RequestException as e:
                wait = self.backoff_factor ** attempt
                logging.warning(f"Request failed: {e}. Retrying in {wait} sec...")
                time.sleep(wait)
                attempt += 1

        logging.error("Max retries reached. Could not fetch data.")
        return None
