chrome.runtime.onInstalled.addListener((details) => {
    // Check if the extension was just updated
    if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
        
        // Grab the version number from your manifest.json (e.g., "2.8")
        const currentVersion = chrome.runtime.getManifest().version;
        
        // GitHub automatically formats markdown headers into anchor links.
        // It converts them to lowercase, replaces spaces with dashes, and removes punctuation (like periods).
        // So a header like "## 2.8" becomes "#28"
        const anchorLink = currentVersion.replace(/\./g, '');
        
        // Replace this URL with your actual GitHub repository URL
        const changelogUrl = `https://pbsinnett.github.io/ypt/#whats-new`;

        // Open the changelog in a new tab
        chrome.tabs.create({ url: changelogUrl });
    } 
    else if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.tabs.create({ url: changelogUrl });
    }
});