export const BASE_API_URL =
  process.env.BASE_API_URL ?? "https://api.socigy.com";
export const BASE_V1_API_URL = `${BASE_API_URL}${
  process.env.BASE_V1_API_URL ?? "/v1"
}`;
