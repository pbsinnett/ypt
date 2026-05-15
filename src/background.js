chrome.runtime.onInstalled.addListener((details) => {
    // 1. Define the URL at the top so the whole listener can see it
    const changelogUrl = "https://pbsinnett.github.io/ypt/#whats-new";

    // 2. Combine the checks! If it's an install OR an update, open the tab.
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL || 
        details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
        
        chrome.tabs.create({ url: changelogUrl });
    }
});