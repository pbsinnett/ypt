# YouTube Playlist Tools

[![Available in the Chrome Web Store](./images/store-badge.png)](https://chromewebstore.google.com/detail/youtube-playlist-tools/ehkkmfabomefdhfbegkiohmoiolfbjpo)

A powerful, fully accessible browser extension that adds advanced sorting, real-time statistics, and performance tools to YouTube playlists.

## Key Features

* **Instant "Load All":** Solves the "infinite scroll" problem by force-loading every video in a playlist into the DOM. This ensures screen readers can navigate the entire list and sorting is 100% accurate.
* **Smart Time Math:** Automatically calculates the total playlist duration and remaining watch time. 
* **Dynamic Speed Scaling:** Adjust the "Speed" input (e.g., 1.5x, 2.0x) to see your "Time Remaining" update instantly based on your playback pace.
* **NEW!** Now speed will adjust based on the speed control in the toolbar. The speed control also stays in sync with video speed if set via another method.
* **NEW!** One-click buttons to do the most common actions:
    * **Add to queue:** Queue up a bunch of videos fast!
    * **Save to Watch Later:** Add videos to your Watch Later without realizing how easy it is, then get frustrated that you now have over 80 hours of videos you won't be able to get through for a long time. Yes, I have a problem.
    * **Remove from queue/playlist (hide on subscriptions page):** Instantly nuke that video you watched or found boring and uninteresting.
* **NEW!** For screen readers, puts watched percentages directly in the heading for videos. Now you'll see exactly how much of that long documentary you've watched. We've never had access to this information before!
* **NEW!** For screen readers, you'll always see the best version of the ARIA label on videos that includes the time. This wasn't being shown in the miniplayer queue.
* **Advanced Sorting:** Organize your videos by:
    * Channel Name (Group by creator)
    * Duration (Shortest to longest)
    * Title (A-Z)
    * Progress (Watched vs. Unwatched)
    * **NEW!** Date (Get to your newest videos first)
    * Index (Default)

## Accessibility First

This project was built specifically to improve the YouTube experience for screen reader users (NVDA, JAWS, VoiceOver).

* **Stable UI:** Injects a consistent toolbar that stays where you're focused, whether it be in a full playlist or the miniplayer queue.
* **ARIA Live Regions:** Status updates and error messages are announced immediately to assistive technology.
* **Theme-Matching:** Seamlessly matches the page's color in light or dark mode.

## Installation (Developer Mode)

1. Download or clone this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer Mode** (toggle in the top right).
4. Click **Load Unpacked** and select the project folder.

## License

This project is licensed under the **GNU GPLv3**. 

You are free to use, modify, and distribute this software, provided that any derivative works are also licensed under the GPLv3 and remain open-source. See the `LICENSE` file for the full legal text.
