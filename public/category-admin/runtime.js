export const RUNTIME_MODES = Object.freeze(["PUBLIC_DEMO", "STAGING_API", "LIVE_API"]);

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function normalizeBase(value) {
  return String(value || "").replace(/\/$/, "");
}

export function resolveRuntimeConfig({ hostname, origin, configuredMode = "AUTO", apiBase = "" }) {
  const normalizedHost = String(hostname || "").toLowerCase();
  const requestedMode = String(configuredMode || "AUTO").toUpperCase();
  const explicitMode = RUNTIME_MODES.includes(requestedMode) ? requestedMode : null;
  const mode = explicitMode
    || (normalizedHost.endsWith("github.io")
      ? "PUBLIC_DEMO"
      : normalizedHost.includes("staging")
        ? "STAGING_API"
        : "LIVE_API");

  return {
    mode,
    apiBase: normalizeBase(apiBase || origin),
    isDemo: mode === "PUBLIC_DEMO",
    isLocalDevelopment: LOCAL_HOSTS.has(normalizedHost),
  };
}

export function createAdminApi({
  runtime,
  demoApi,
  fetchImpl,
  roleProvider = () => "READ_ONLY",
}) {
  return async function adminApi(path, options = {}) {
    if (runtime.isDemo) return demoApi(path, options, roleProvider());

    const headers = { "content-type": "application/json", ...options.headers };
    if (runtime.isLocalDevelopment) {
      headers["x-admin-email"] = "local.operator@bobaedream.local";
      headers["x-admin-role"] = roleProvider();
    }

    let response;
    try {
      response = await fetchImpl(`${runtime.apiBase}${path}`, { ...options, headers });
    } catch (cause) {
      const error = new Error(`${runtime.mode} API에 연결할 수 없습니다. 데모 데이터로 전환하지 않았습니다.`);
      error.code = "api_connection_failed";
      error.cause = cause;
      throw error;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const error = new Error(`${runtime.mode} API가 JSON이 아닌 응답을 반환했습니다.`);
      error.code = "invalid_api_response";
      throw error;
    }

    const body = await response.json();
    if (!response.ok) {
      const error = new Error(body.details?.join("\n") || body.message || body.error || "요청 실패");
      error.code = body.error || "api_request_failed";
      error.status = response.status;
      throw error;
    }
    return body;
  };
}
