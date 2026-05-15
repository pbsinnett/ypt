const MASTER_MAP = {
    home: ['queue', 'watchLater', 'playlist', 'download', 'downloadMobile', 'share', 'notInterested', 'dontRecommend'],
    search: ['queue', 'watchLater', 'playlist', 'download', 'downloadMobile', 'share'],
    watchLater: ['queue', 'playlist', 'removeWl', 'download', 'downloadMobile', 'share', 'moveTop', 'moveBot'],
    playlist: ['queue', 'watchLater', 'playlist', 'removePlaylist', 'download', 'downloadMobile', 'share', 'moveTop', 'moveBot'],
    subscriptions: ['queue', 'watchLater', 'playlist', 'download', 'downloadMobile', 'share', 'hide'],
    likedVideos: ['queue', 'watchLater', 'playlist', 'download', 'downloadMobile', 'share', 'removeLiked'],
    watchHistory: ['queue', 'playlist', 'watchLater', 'download', 'downloadMobile', 'share', 'removeHistory'],
    youHistoryShelf: ['queue', 'playlist', 'watchLater', 'download', 'downloadMobile', 'share', 'removeHistory'],
    youPlaylistsShelf: ['edit', 'delete'],
    youWatchLaterShelf: ['queue', 'playlist', 'download', 'downloadMobile', 'share', 'removeWl'],
    youLikedVideosShelf: ['queue', 'watchLater', 'playlist', 'download', 'downloadMobile', 'share'],
    yourProfileHome: ['queue', 'playlist', 'watchLater', 'download', 'downloadMobile', 'share', 'promote'],
    otherProfileHome: ['queue', 'playlist', 'watchLater', 'download', 'downloadMobile', 'share'],
    yourProfileVideos: ['queue', 'playlist', 'watchLater', 'download', 'downloadMobile', 'share', 'promote'],
    otherProfileVideos: ['queue', 'playlist', 'watchLater', 'download', 'downloadMobile', 'share'],
    yourProfilePlaylists: ['edit', 'delete'],
    otherProfilePlaylists: [],
    otherProfileLive: ['queue', 'playlist', 'watchLater', 'download', 'downloadMobile', 'share'],
    watch: ['queue', 'watchLater', 'notInterested']
};

const ZONE_TITLES = {
    home: "Home", search: "Search Pages", watchLater: "Watch Later (Main Page)", playlist: "Playlist Pages",
    subscriptions: "Subscriptions", likedVideos: "Liked Videos (Main Page)", watchHistory: "Watch History (Main Page)",
    youHistoryShelf: "You - History Shelf", youPlaylistsShelf: "You - Playlists Shelf",
    youWatchLaterShelf: "You - Watch Later Shelf", youLikedVideosShelf: "You - Liked Videos Shelf",
    yourProfileHome: "Your Profile - Home", otherProfileHome: "Other Profiles - Home",
    yourProfileVideos: "Your Profile - Videos", otherProfileVideos: "Other Profiles - Videos",
    yourProfilePlaylists: "Your Profile - Playlists", otherProfilePlaylists: "Other Profiles - Playlists",
    otherProfileLive: "Other Profiles - Live", watch: "Watch Page"
};

const ZONE_GROUPS = [
    { title: "Core Navigation", zones: ['home', 'search', 'watch', 'subscriptions'] },
    { title: "Library & History (Main Pages)", zones: ['watchLater', 'playlist', 'likedVideos', 'watchHistory'] },
    { title: "The 'You' Page (Shelves)", zones: ['youHistoryShelf', 'youPlaylistsShelf', 'youWatchLaterShelf', 'youLikedVideosShelf'] },
    { title: "Your Channel", zones: ['yourProfileHome', 'yourProfileVideos', 'yourProfilePlaylists'] },
    { title: "Other Channels", zones: ['otherProfileHome', 'otherProfileVideos', 'otherProfilePlaylists', 'otherProfileLive'] }
];

const LABELS = {
    queue: 'Add to queue', 
    watchLater: 'Save to Watch Later', 
    playlist: 'Save to Playlist', 
    download: 'Download', 
    downloadMobile: 'Download to Mobile', 
    share: 'Share', 
    notInterested: 'Not interested', 
    dontRecommend: "Don't recommend channel", 
    removeWl: 'Remove from Watch Later', 
    removePlaylist: 'Remove from Playlist', 
    removeLiked: 'Remove from Liked', 
    removeHistory: 'Remove from History', 
    moveTop: 'Move to top', 
    moveBot: 'Move to bottom', 
    hide: 'Hide', 
    edit: 'Edit', 
    delete: 'Delete', 
    promote: 'Promote'
};

const DEFAULT_ACTIVE = {
    home: ['queue', 'watchLater', 'notInterested'], search: ['queue', 'watchLater'],
    watchLater: ['removeWl', 'moveTop', 'moveBot'], playlist: ['removePlaylist', 'moveTop', 'moveBot'],
    subscriptions: ['queue', 'watchLater', 'hide'], likedVideos: ['queue', 'watchLater', 'removeLiked'],
    watchHistory: ['queue', 'watchLater', 'removeHistory'], youHistoryShelf: ['queue', 'watchLater', 'removeHistory'],
    youPlaylistsShelf: ['edit', 'delete'], youWatchLaterShelf: ['queue', 'playlist', 'removeWl'],
    youLikedVideosShelf: ['queue', 'watchLater', 'playlist'], yourProfileHome: ['queue', 'watchLater', 'promote'],
    otherProfileHome: ['queue', 'watchLater', 'share'], yourProfileVideos: ['queue', 'watchLater', 'promote'],
    otherProfileVideos: ['queue', 'watchLater', 'share'], yourProfilePlaylists: ['edit', 'delete'],
    otherProfilePlaylists: [], otherProfileLive: ['queue', 'watchLater', 'share'], watch: ['queue', 'watchLater', 'notInterested']
};

let announceTimeout;
function announceMove(itemLabel) {
    const announcer = document.getElementById('dragAnnouncer');
    const parent = itemLabel.parentNode;
    const index = Array.from(parent.children).indexOf(itemLabel) + 1;
    const total = parent.children.length;
    const itemName = itemLabel.textContent.trim(); 
    announcer.textContent = `${itemName} moved to position ${index} of ${total}.`;
    clearTimeout(announceTimeout);
    announceTimeout = setTimeout(() => { announcer.textContent = ''; }, 500);
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetch Storage FIRST
    chrome.storage.sync.get({ ytBtnConfig: {} }, (data) => {
        const savedConfig = data.ytBtnConfig || {};
        const container = document.getElementById('zonesContainer');
        
        // 2. Build DOM using saved order
        ZONE_GROUPS.forEach(group => {
            const activeZones = group.zones.filter(z => MASTER_MAP[z] && MASTER_MAP[z].length > 0);
            if (activeZones.length === 0) return;

            const heading = document.createElement('h2');
            heading.textContent = group.title;
            container.appendChild(heading);

            activeZones.forEach(zone => {
                const zoneData = savedConfig[zone] || {};
                
                // Use saved order if it exists, otherwise use MASTER_MAP
                const orderedBtns = zoneData.order && zoneData.order.length > 0 ? zoneData.order : MASTER_MAP[zone];
                // Use saved active states if they exist, otherwise use DEFAULT_ACTIVE
                const activeBtns = zoneData.active ? zoneData.active : DEFAULT_ACTIVE[zone];

                const card = document.createElement('div');
                card.className = 'zone-card';
                card.innerHTML = `<h3 class="zone-title">${ZONE_TITLES[zone]}</h3>`;
                
                const grid = document.createElement('div');
                grid.className = 'button-grid';
                
                orderedBtns.forEach(btnKey => {
                    const label = document.createElement('label');
                    label.className = 'checkbox-wrapper';
                    label.draggable = true;
                    
                    const isChecked = activeBtns.includes(btnKey) ? 'checked' : '';
                    label.innerHTML = `<input type="checkbox" data-zone="${zone}" value="${btnKey}" aria-describedby="dragInst" ${isChecked}> ${LABELS[btnKey]}`;
                    
                    // Mouse Drag
                    label.addEventListener('dragstart', function(e) { this.style.opacity = '0.4'; window.draggedItem = this; e.dataTransfer.effectAllowed = 'move'; });
                    label.addEventListener('dragend', function() { this.style.opacity = '1'; window.draggedItem = null; });
                    label.addEventListener('dragover', function(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
                    label.addEventListener('dragenter', function() { if (this !== window.draggedItem) this.classList.add('drag-over'); });
                    label.addEventListener('dragleave', function() { this.classList.remove('drag-over'); });
                    label.addEventListener('drop', function(e) {
                        e.stopPropagation(); this.classList.remove('drag-over');
                        if (window.draggedItem && this !== window.draggedItem) this.parentNode.insertBefore(window.draggedItem, this);
                    });

                    // Keyboard Drag
                    label.addEventListener('keydown', function(e) {
                        if (!e.altKey) return;
                        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                            e.preventDefault(); const prev = this.previousElementSibling;
                            if (prev) { this.parentNode.insertBefore(this, prev); announceMove(this); this.querySelector('input').focus(); }
                        } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                            e.preventDefault(); const next = this.nextElementSibling;
                            if (next) { this.parentNode.insertBefore(this, next.nextElementSibling); announceMove(this); this.querySelector('input').focus(); }
                        }
                    });

                    grid.appendChild(label);
                });
                
                card.appendChild(grid);
                container.appendChild(card);
            });
        });

        // 3. Enforce Max 3 limit
        container.addEventListener('change', (e) => {
            if (e.target.type !== 'checkbox') return;
            const zone = e.target.dataset.zone;
            if (document.querySelectorAll(`input[data-zone="${zone}"]:checked`).length > 3) e.target.checked = false;
        });
    }); // End Storage Fetch

    // --- SAVE BUTTON ---
    document.getElementById('saveButton').addEventListener('click', () => {
        const newConfig = {};
        for (const zone of Object.keys(MASTER_MAP)) {
            const allInputs = Array.from(document.querySelectorAll(`input[data-zone="${zone}"]`));
            newConfig[zone] = {
                order: allInputs.map(cb => cb.value),
                active: allInputs.filter(cb => cb.checked).map(cb => cb.value)
            };
        }
        
        chrome.storage.sync.set({ ytBtnConfig: newConfig }, () => {
            const msg = document.getElementById('statusMessage');
            msg.textContent = 'Options saved!';
            
            chrome.tabs.query({ url: "*://*.youtube.com/*" }, (tabs) => {
                tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, { action: "configUpdated", config: newConfig }).catch(() => {}));
            });
            setTimeout(() => msg.textContent = '', 2500);
        });
    });

    // --- RESTORE DEFAULTS ---
    document.getElementById('resetButton').addEventListener('click', () => {
        // Clear storage and reload the page to rebuild from MASTER_MAP
        chrome.storage.sync.remove('ytBtnConfig', () => {
            window.location.reload();
        });
    });

    // --- EXPORT ---
    document.getElementById('exportBtn').addEventListener('click', () => {
        chrome.storage.sync.get({ ytBtnConfig: {} }, (data) => {
            const blob = new Blob([JSON.stringify(data.ytBtnConfig, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'yt-tools-backup.json';
            document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        });
    });

    // --- IMPORT ---
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');

    importBtn.addEventListener('click', () => importFile.click());

    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedConfig = JSON.parse(event.target.result);
                if (typeof importedConfig === 'object' && importedConfig !== null) {
                    chrome.storage.sync.set({ ytBtnConfig: importedConfig }, () => {
                        window.location.reload(); // Reload to physically redraw the dragged items
                    });
                } else alert("Invalid configuration file format.");
            } catch (err) { alert("Error reading file. Please ensure it is a valid JSON backup."); }
            importFile.value = '';
        };
        reader.readAsText(file);
    });

    document.getElementById('closeBtn').addEventListener('click', () => window.close());
});