# YouTube Playlist Tools

<div align="center">
  <img src="./images/icons/logo.svg" width="250" alt="A minimalist logo featuring three dark grey horizontal list bars on the left, with a light blue curved arrow pointing down and to the right toward a stylized orange stopwatch.">
  <br>
  <a href="https://chromewebstore.google.com/detail/youtube-playlist-tools/ehkkmfabomefdhfbegkiohmoiolfbjpo">
    <img src="./images/store-badge.png" alt="Available in the Chrome Web Store">
  </a>
</div>

A powerful, fully accessible browser extension that adds advanced sorting, real-time statistics, and one-click buttons to YouTube playlists.

## Features

* **Instant "Load All":** Solves the "infinite scroll" problem by loading videos in a playlist into the DOM. This ensures screen readers can navigate the entire list and sorting is 100% accurate. 
* **Smart Time Math:** Automatically calculates the total playlist duration and remaining watch time. 
* **Dynamic Speed Scaling:** Adjust the "Speed" input to see your "Time Remaining" update instantly based on your playback pace.
* **Speed Sync:** Speed adjustments in the toolbar automatically sync with the video speed, and vice versa.
* **Advanced Sorting:** Organize your videos by Original Order, Alphabetical, Channel Name, Date Published, Length, Most Popular, or Watch Progress.
* **Quick Actions:** Set up one-click buttons to take your most common actions on videos instantly.
* **Built for Accessibility:** Fully keyboard navigable with comprehensive screen-reader support, dynamic ARIA labels, and visual watched-percentage indicators.

## How to Use YouTube Playlist Tools

YouTube Playlist Tools is designed to give you total control over how you consume content, all wrapped in a UI that feels native to YouTube. 

### The Toolbar & Real-Time Stats

Wherever there is a list of videos—from your Watch Later playlist to the Miniplayer queue—the extension injects a seamless, theme-matching toolbar. 
* **Time Math:** Instantly see exactly how many videos are in your queue, the total duration, and your remaining watch time.
* **Speed Scaling:** Tweak the speed multiplier (e.g., 1.5x, 2.0x) and watch the time remaining recalculate instantly so you know exactly when you'll finish a playlist.

<img src="./images/screenshots/store/2-watch-later_formatted.png" alt="Screenshot of the Watch Later page with the toolbar injected at the top. The Remove Watched button is also shown" width="700">

<img src="./images/screenshots/store/3-watch-later-dark_formatted.png" alt="Screenshot of the same Watch Later page, but seamlessly matching YouTube's dark mode" width="700">

<img src="./images/screenshots/store/4-miniplayer_formatted.png" alt="Screenshot of Watch Later with the toolbar docked cleanly to the expanded Miniplayer showing there are two videos in the queue" width="700">

### "Load All" & Advanced Sorting

YouTube hides long playlists behind an "infinite scroll," which breaks native sorting and makes screen-reader navigation incredibly frustrating.
* **Load All:** Click the button to automatically scroll and load the entire playlist into the DOM (stops at 3000 videos or at the end of the list). 
* **Sort Anything:** Once loaded, sort by Date, Popularity, Length, or even Channel Name (which conveniently groups movies by genre!). 

<img src="./images/screenshots/store/7-load-all_formatted.png" alt="Screenshot showing the Load All functionality. The information has changed to show the loaded video count, and the 'Load All' button has changed to 'Stop.'" width="700">

<img src="./images/screenshots/store/5-sort-subs_formatted.png" alt="Screenshot of the toolbar sorting the Subscriptions page in alphabetical order" width="700">

<img src="./images/screenshots/store/6-sort-search_formatted.png" alt="Screenshot of the toolbar sorting a search page. Movies are sorted by genre" width="700">

> **Pro Tip: Chained Sorts**
> Since this extension uses stable sorting algorithms, you can chain sorts together to make secondary and even tertiary orderings! The trick is to apply your sorts in reverse order of importance. For example: if you want to group videos by Channel and have each channel's videos ordered by Views, Sort by *Most Popular* first, then sort by *Channel Name*. To reset everything, just sort by Original Order again.

### Customizing Quick Actions

Stop digging through YouTube's hidden "three-dot" menus. Add one-click action buttons directly to videos. 
* **Add to queue:** Queue up a bunch of videos fast!
* **Save to Watch Later:** Add videos to your Watch Later without realizing how easy it is, then get frustrated that you now have over 80 hours of videos you won't be able to get through for a long time. (Yes, I have a problem.)
* **Remove / Hide:** Instantly nuke that video you watched or found boring and uninteresting.

**The Button Factory:** Open the extension's Options page to fully customize which buttons appear in over 16 different YouTube zones. Select up to three buttons per zone and drag-and-drop them into your preferred order!

<img src="./images/screenshots/store/1-options_formatted.png" alt="Screenshot of the options page showing the checkboxes and drag-and-drop layout for different YouTube zones" width="700">

### Accessibility First

This project was built specifically with screen reader users (NVDA, JAWS, VoiceOver) in mind.
* **Visual Info Accessibility:** Puts watched percentages directly in the heading for videos. You'll see exactly how much of that long documentary you've watched—information previously inaccessible to screen readers! News, live, and upcoming videos are also indicated, making it incredibly fast to skim.
* **Get the Most Information:** You'll always hear the best version of the ARIA label on videos, including the time (which wasn't being shown in the miniplayer queue).
* **Keyboard Support:** Checkboxes in the Options page can be seamlessly reordered using `Alt/Option + Up/Down Arrows`.

## What's New

### 3.19: What was supposed to be a small update

* Updated the toolbar to appear almost everywhere. Sort on the subscriptions page, watch later, even a channel's streams and videos.
* Added one-click buttons in more places. They're also contextually aware depending on the page and type of content. Only the buttons that are in the action menu are available.
* Renamed sorting methods to be a little more explanatory. For example, Index is now Original Order, Duration is now Length, Views is now Most Popular, etc.
* Sorting by channel name also groups movies by genre!
* Updated sorting function to keep items grouped in the shelf they're originally in. Sorting also brings live content to the top and sorts them together.
* Fixed minimum and maximum speed to not go outside actual limits.
* Set speed should stick between videos.
* **Massive Architectural Overhaul:** Replaced hardcoded buttons with a dynamic Button Factory powered by Chrome Storage Sync.
* Added a brand-new Options Page! You can now customize exactly which buttons (up to 3) appear in 16+ different YouTube zones.
* Added drag-and-drop button reordering to the Options page (fully screen-reader accessible via Alt/Option + Arrow keys).
* **Live Updates:** Changing button layouts in the Options page instantly redraws buttons across all open YouTube tabs—no refresh required!
* Added Import/Export functionality: Back up, restore, and share your exact layout preferences via JSON files.
* Added native Light/Dark mode support for the Options page to match system settings seamlessly.
* Added specialized layout handling for the Premium Benefits page (safely suppresses the toolbar and enforces the "Not interested" button).
* Opens in a new tab on update/new install to show this page.

### 2.51

* **THEME INTEGRATION:** The toolbar now seamlessly matches YouTube's Light and Dark modes!
* Added date and view count sorting. I know you can sort by date with YouTube sorting, but why not have it all? Hopefully it prevents at least one bad rating.
* **MINIPLAYER QUEUE SUPPORT:** Expanding the miniplayer queue now docks the toolbar above the queued videos, allowing you to see the total duration of your queue and apply temporary sorts. Very handy to leave open and watch the updating progress as you add videos to the queue!
* **ONE-CLICK BUTTONS:** You can now add to queue/watched later, remove watched videos from watch later, remove video from current playlist/queue, and hide video on the subscriptions page with one click. No more extra clicks for essential actions.
* **UPDATED SPEED CONTROL:** Now setting the speed in the toolbar will update the video speed! It also follows the speed of the video if it gets set by another method.
* **WATCHED ACCESSIBILITY:** Added watched percentages to the beginning of ARIA labels on videos. This information hasn't ever been shown to screen reader users! Now you'll always know if you watched a video, and how much of it you've watched.
* **OTHER ACCESSIBILITY IMPROVEMENTS:** Updated the video's ARIA label to use the best version with the most information and labeled the miniplayer queue button.

## Installation (Developer Mode)

### Step 1: Build the Extension

1. Download or clone this repository.
2. Open a terminal in the root directory and run the build script:
   ```bash
   node build.js
   ```
3. You will now have optimized extensions generated in the `dist/chrome` and `dist/firefox` folders.

### Step 2: Load into Chrome & Microsoft Edge

1. Navigate to `chrome://extensions` (Chrome) or `edge://extensions` (Edge).
2. Enable **Developer mode** via the toggle switch in the top right.
3. Click **Load unpacked** and select the generated `dist/chrome` directory.

### Step 3: Load into Firefox

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**
3. Select the `manifest.json` file inside the generated `dist/firefox` directory.

## License

This project is licensed under the **GNU GPLv3**. 

You are free to use, modify, and distribute this software, provided that any derivative works are also licensed under the GPLv3 and remain open-source. See the `LICENSE` file for the full legal text.