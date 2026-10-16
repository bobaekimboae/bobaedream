function firstHttps(items) {
  return (Array.isArray(items) ? items : []).find((item) => /^https:\/\//i.test(String(item?.href || ""))) || null;
}

export function pickIframelyPreview(data) {
  const linksAllowed = data?.access?.decision?.links?.allowed;
  if (linksAllowed === false) {
    return { allowed: false, image: "", logo: "", site: "", status: "publisher-blocked" };
  }
  const image = firstHttps(data?.links?.thumbnail);
  const logo = firstHttps(data?.links?.logo) || firstHttps(data?.links?.icon);
  return {
    allowed: true,
    image: image?.href || "",
    logo: logo?.href || "",
    site: String(data?.meta?.site || "").trim(),
    status: image?.href ? "ready" : "no-thumbnail",
  };
}

export async function fetchIframelyPreview(url, apiKey, fetcher = fetch) {
  const endpoint = new URL("https://iframe.ly/api/data");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("api_key", apiKey);
  endpoint.searchParams.set("mode", "discover");
  endpoint.searchParams.set("use", "reference");
  const response = await fetcher(endpoint, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`Iframely HTTP ${response.status}`);
  return pickIframelyPreview(await response.json());
}
