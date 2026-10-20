export function registerPrototypeApp() {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
  const manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!manifest) return;
  const base = new URL("./", manifest.href);
  // Derive the project-site base instead of claiming the entire github.io host.
  void navigator.serviceWorker.register(new URL("sw.js", base), { scope: base.pathname, updateViaCache: "none" }).catch(() => {
    // The online prototype remains usable when a browser disables installation.
  });
}
