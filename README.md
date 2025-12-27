# YouTube Playlist Tools

A powerful, fully accessible browser extension that adds advanced sorting, real-time statistics, and performance tools to YouTube playlists.

## Key Features

* **Instant "Load All":** Solves the "infinite scroll" problem by force-loading every video in a playlist into the DOM. This ensures screen readers can navigate the entire list and sorting is 100% accurate.
* **Smart Time Math:** Automatically calculates the total playlist duration and remaining watch time. 
* **Dynamic Speed Scaling:** Adjust the "Speed" input (e.g., 1.5x, 2.0x) to see your "Time Remaining" update instantly based on your playback pace.
* **Advanced Sorting:** Organize your videos by:
    * Channel Name (Group by creator)
    * Duration (Shortest to longest)
    * Title (A-Z)
    * Progress (Watched vs. Unwatched)
    * Original Index

## Accessibility First

This project was built specifically to improve the YouTube experience for screen reader users (NVDA, JAWS, VoiceOver).
* **Stable UI:** Injects a consistent toolbar that doesn't jump around or lose focus.
* **ARIA Live Regions:** Status updates and error messages are announced immediately to assistive technology.
* **High Contrast:** Designed with a dark, high-contrast UI for maximum visibility.

## Installation (Developer Mode)

1. Download or clone this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer Mode** (toggle in the top right).
4. Click **Load Unpacked** and select the project folder.

## License

This project is licensed under the **GNU GPLv3**. 

You are free to use, modify, and distribute this software, provided that any derivative works are also licensed under the GPLv3 and remain open-source. See the `LICENSE` file for the full legal text.
