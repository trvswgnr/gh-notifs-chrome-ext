const manifest: ManifestV3 = {
    manifest_version: 3,
    name: "Better GitHub Notifications",
    version: "1.0",
    background: { service_worker: "background.ts" },
    permissions: ["identity", "storage", "alarms"],
    content_scripts: [{ matches: ["https://github.com/*"], js: ["content.js"] }],
    action: { default_popup: "popup.html" },
    oauth2: { client_id: "43ce600f21d429a85512", scopes: ["user"] },
    options_ui: { page: "options.html", open_in_tab: false },
};

export default manifest;
