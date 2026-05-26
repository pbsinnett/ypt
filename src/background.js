chrome.runtime.onInstalled.addListener((details) => {
  const installUrl = "https://pbsinnett.github.io/ypt#youtube-playlist-tools";
  const changelogUrl = "https://pbsinnett.github.io/ypt#whats-new";
  let targetUrl = "";

  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    targetUrl = installUrl;
  } else if (details.reason === chrome.runtime.OnInstalledReason.UPDATE) {
    targetUrl = changelogUrl;
  }

  if (targetUrl) {
    setTimeout(() => {
      chrome.tabs.create({ url: targetUrl });
    }, 150);
  }
});