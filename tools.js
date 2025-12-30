(function() {
    'use strict';

    const CONTAINER_ID = 'yt-tools-toolbar-v70';
    const STATUS_ID = 'yt-tools-status-v70';
    
    // IDs for stable text spans
    const SPAN_TOTAL_ID = 'yt-tools-text-total';
    const SPAN_PROG_ID = 'yt-tools-text-prog';
    
    // State management
    let lastUrl = location.href; 
    let state = {
        speed: 1.0,
        sortType: 'index', 
        sortOrder: 'asc',
        isLoading: false 
    };

    /* --- DOM HELPER --- */
    function createEl(tag, styles = {}, text = null) {
        const el = document.createElement(tag);
        Object.assign(el.style, styles);
        if (text) el.textContent = text;
        return el;
    }

    /* --- PARSING --- */
    function parseDurationFromText(text) {
        if (!text) return 0;
        text = text.toLowerCase().trim().replace(/\s+/g, ' ');

        if (text.includes(':')) {
            const parts = text.split(':').map(Number);
            if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
            if (parts.length === 2) return parts[0] * 60 + parts[1];
            return parts[0];
        }
        
        let seconds = 0;
        const h = text.match(/(\d+)\s*(?:hour|hr)/);
        const m = text.match(/(\d+)\s*(?:minute|min)/);
        const s = text.match(/(\d+)\s*(?:second|sec)/);
        
        if (h) seconds += parseInt(h[1]) * 3600;
        if (m) seconds += parseInt(m[1]) * 60;
        if (s) seconds += parseInt(s[1]);
        
        return seconds;
    }

    // --- DIGITAL CLOCK FORMATTER ---
    function formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return "0:00";
        
        let h = Math.floor(seconds / 3600);
        let m = Math.floor((seconds % 3600) / 60);
        let s = Math.floor(seconds % 60);

        const mStr = m.toString().padStart(2, '0');
        const sStr = s.toString().padStart(2, '0');
        
        if (h > 0) return `${h}:${mStr}:${sStr}`;
        return `${m}:${sStr}`;
    }

    /* --- DATA EXTRACTOR --- */
    function getVideoID(vid) {
        const link = vid.querySelector('a#thumbnail');
        if (link && link.href) {
            const match = link.href.match(/[?&]v=([^&]+)/);
            return match ? match[1] : null;
        }
        return null;
    }

    function getVideoData(vid, index) {
        let duration = 0;
        const badge = vid.querySelector('.yt-badge-shape__text') || 
                      vid.querySelector('span#text.ytd-thumbnail-overlay-time-status-renderer') ||
                      vid.querySelector('.badge-shape-wiz__text');
        
        if (badge && badge.textContent.includes(':')) {
            duration = parseDurationFromText(badge.textContent);
        }

        if (duration === 0) {
            const titleHeader = vid.querySelector('h3');
            if (titleHeader) {
                const aria = titleHeader.getAttribute('aria-label');
                if (aria) duration = parseDurationFromText(aria);
            }
        }

        let progress = 0;
        const progContainer = vid.querySelector('ytd-thumbnail-overlay-resume-playback-renderer');
        if (progContainer) {
            const bar = progContainer.querySelector('#progress');
            if (bar && bar.style.width) {
                progress = parseFloat(bar.style.width); 
            }
        }

        const titleEl = vid.querySelector('#video-title');
        const title = titleEl ? titleEl.textContent.trim() : "";
        const id = getVideoID(vid);
        
        let originalIndex = parseInt(vid.getAttribute('data-original-index'));
        if (isNaN(originalIndex)) {
            vid.setAttribute('data-original-index', index);
            originalIndex = index;
        }

        let channel = "";
        const channelEl = vid.querySelector('.ytd-channel-name') || vid.querySelector('#channel-name');
        if (channelEl) {
            channel = channelEl.textContent.trim();
        }

        return { duration, progress, title, channel, originalIndex, element: vid, id };
    }

    /* --- CLEANER --- */
    function cleanAndGetRows() {
        const listA = document.querySelector('ytd-playlist-video-list-renderer #contents');
        const listB = document.querySelector('#items.ytd-playlist-panel-renderer');
        const container = listA || listB;
        if (!container) return { container: null, rows: [] };
        
        const rawRows = Array.from(container.children).filter(el => 
            el.tagName && el.tagName.toLowerCase().includes('video-renderer')
        );

        const seenIds = new Set();
        const uniqueRows = [];

        rawRows.forEach(row => {
            const id = getVideoID(row);
            if (!id) return; 
            if (seenIds.has(id)) {
                row.remove(); 
            } else {
                seenIds.add(id);
                uniqueRows.push(row);
            }
        });

        return { container, rows: uniqueRows };
    }

    /* --- AUTO SCROLLER --- */
    function loadAllVideos() {
        if (state.isLoading) return; 
        state.isLoading = true;

        const spanTotal = document.getElementById(SPAN_TOTAL_ID);
        if (spanTotal) spanTotal.textContent = "Loading...";

        let lastHeight = 0;
        let attempts = 0;

        const scrollInterval = setInterval(() => {
            const scrollingElement = document.documentElement || document.body;
            scrollingElement.scrollTop = scrollingElement.scrollHeight;

            const currentHeight = scrollingElement.scrollHeight;
            const { rows } = cleanAndGetRows();

            if (spanTotal) spanTotal.textContent = `Loading... (${rows.length} found)`;

            if (currentHeight === lastHeight) {
                attempts++;
                if (attempts >= 3) {
                    clearInterval(scrollInterval);
                    state.isLoading = false;
                    scrollingElement.scrollTop = 0; 
                    updateStats();
                    if(spanTotal) spanTotal.textContent = `All Loaded (${rows.length})`;
                }
            } else {
                attempts = 0; 
                lastHeight = currentHeight;
            }
        }, 500); 
    }

    /* --- UI BUILDER --- */
    function injectToolbar() {
        if (document.getElementById(CONTAINER_ID)) return;

        let target = document.querySelector('ytd-playlist-video-list-renderer') ||
                     document.querySelector('#contents.ytd-item-section-renderer');

        if (!target) {
            target = document.querySelector('.metadata-buttons-wrapper') || 
                     document.querySelector('ytd-playlist-header-renderer .metadata-action-bar');
        }
        
        if (!target) return;

        // Container: Light off-white surface
        const container = createEl('div', {
            display: 'flex', 
            alignItems: 'center', 
            flexWrap: 'wrap',
            gap: '12px',
            margin: '0 0 16px 0',
            background: '#f9f9f9',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid #e5e5e5',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            zIndex: '1000',
            fontFamily: '"Roboto", "Arial", sans-serif'
        });
        container.id = CONTAINER_ID;

        // Common Pill Button Style
        const pillBtnStyle = {
            background: 'rgba(0, 0, 0, 0.05)',
            color: '#0f0f0f',
            border: 'none', 
            borderRadius: '18px', 
            padding: '6px 16px', 
            cursor: 'pointer', 
            fontSize: '13px', 
            fontWeight: '500',
            transition: 'background 0.2s'
        };

        // Load All Button (Primary Action)
        const loadBtn = createEl('button', Object.assign({}, pillBtnStyle, {
            background: '#0f0f0f',
            color: '#ffffff'
        }), 'Load All');
        
        loadBtn.onclick = (e) => {
            e.preventDefault();
            loadAllVideos();
        };

        // Common Input/Select Style
        const inputStyle = {
            background: '#ffffff',
            color: '#0f0f0f',
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            fontSize: '13px',
            outline: 'none'
        };

        const sortSelect = createEl('select', inputStyle);
        ['index', 'duration', 'title', 'channel', 'progress'].forEach(opt => {
            const o = document.createElement('option');
            o.value = opt;
            o.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
            sortSelect.appendChild(o);
        });

        const dirSelect = createEl('select', inputStyle);
        [['asc', 'Ascending'], ['desc', 'Descending']].forEach(opt => {
            const o = document.createElement('option');
            o.value = opt[0];
            o.textContent = opt[1];
            dirSelect.appendChild(o);
        });

        const speedInput = createEl('input', Object.assign({}, inputStyle, { width: '45px', textAlign: 'center' }));
        speedInput.type = 'number';
        speedInput.value = state.speed; 
        speedInput.step = '0.1'; 
        speedInput.min = '0.1';  

        // Stats Area
        const statusContainer = createEl('div', { 
            display: 'flex', 
            alignItems: 'center', 
            marginLeft: 'auto', 
            fontSize: '12px', 
            color: '#606060', // Corrected to secondary metadata color
            fontWeight: '400' 
        });
        statusContainer.id = STATUS_ID;

        const spanTotal = createEl('span', { fontWeight: '500', color: '#0f0f0f' }, 'Loading...');
        spanTotal.id = SPAN_TOTAL_ID;
        spanTotal.setAttribute('aria-live', 'polite'); 
        spanTotal.setAttribute('aria-atomic', 'true');

        const spanSep = createEl('span', { margin: '0 8px', color: '#e5e5e5' }, '|');
        
        const spanProg = createEl('span', { color: '#606060' }, ''); // Corrected color
        spanProg.id = SPAN_PROG_ID;
        spanProg.setAttribute('aria-live', 'polite'); 
        spanProg.setAttribute('aria-atomic', 'true');

        statusContainer.appendChild(spanTotal);
        statusContainer.appendChild(spanSep);
        statusContainer.appendChild(spanProg);

        // Assemble with corrected Label colors (#606060)
        container.appendChild(loadBtn); 
        container.appendChild(createEl('span', {fontSize: '13px', color: '#606060'}, 'Sort:'));
        container.appendChild(sortSelect);
        container.appendChild(dirSelect);
        container.appendChild(createEl('span', {fontSize: '13px', color: '#606060'}, 'Speed:'));
        container.appendChild(speedInput);
        container.appendChild(statusContainer);

        // INJECTION
        if (target.parentNode) {
            target.parentNode.insertBefore(container, target);
        }

        // Events
        sortSelect.onchange = (e) => { state.sortType = e.target.value; runSort(spanTotal); };
        dirSelect.onchange = (e) => { state.sortOrder = e.target.value; runSort(spanTotal); };
        
        speedInput.oninput = (e) => { 
            let val = parseFloat(e.target.value);
            if (isNaN(val) || val <= 0) {
                state.speed = 0; 
            } else {
                state.speed = val;
            }
            updateStats(); 
        };
    }

    /* --- STATS UPDATE --- */
    function updateStats() {
        if (state.isLoading) return; 

        const spanTotal = document.getElementById(SPAN_TOTAL_ID);
        const spanProg = document.getElementById(SPAN_PROG_ID);
        if (!spanTotal || !spanProg) return;

        if (state.speed <= 0) {
            spanProg.textContent = "Invalid Speed";
            spanProg.style.color = 'red';
            return;
        }

        try {
            const { rows } = cleanAndGetRows();
            
            if (rows.length === 0) {
                spanTotal.textContent = "No videos found.";
                spanProg.textContent = "";
                return;
            }

            let totalSec = 0;
            let watchedSec = 0;
            let validVideos = 0;

            rows.forEach((row, i) => {
                const data = getVideoData(row, i);
                if (data.duration > 0) {
                    totalSec += data.duration;
                    validVideos++;
                    if (data.progress > 0) {
                        watchedSec += (data.duration * (data.progress / 100));
                    }
                }
            });

            const remaining = (totalSec - watchedSec) / state.speed;
            const scaledTotal = totalSec / state.speed;

            spanTotal.textContent = `Total: ${validVideos} vids (${formatTime(scaledTotal)} at ${state.speed}x)`;
            
            const pct = ((watchedSec/totalSec)*100).toFixed(0);
            spanProg.textContent = `Progress: ${pct}% (${formatTime(remaining)} left)`;
            
            spanProg.style.color = (pct === "100") ? '#4caf50' : '#606060';

        } catch (e) {
            console.error(e);
        }
    }

    function runSort(feedbackEl) {
        if(feedbackEl) feedbackEl.textContent = "Sorting...";

        requestAnimationFrame(() => {
            const { container, rows } = cleanAndGetRows();
            if (!container) return;

            const mapped = rows.map((el, i) => ({ el, data: getVideoData(el, i) }));

            mapped.sort((a, b) => {
                let vA, vB;
                if (state.sortType === 'index') { vA = a.data.originalIndex; vB = b.data.originalIndex; }
                else if (state.sortType === 'title') { vA = a.data.title.toLowerCase(); vB = b.data.title.toLowerCase(); }
                else if (state.sortType === 'channel') { vA = a.data.channel.toLowerCase(); vB = b.data.channel.toLowerCase(); } 
                else if (state.sortType === 'progress') { vA = a.data.progress; vB = b.data.progress; }
                else { vA = a.data.duration; vB = b.data.duration; }

                if (vA < vB) return state.sortOrder === 'asc' ? -1 : 1;
                if (vA > vB) return state.sortOrder === 'asc' ? 1 : -1;
                return 0;
            });

            const spinner = container.querySelector('ytd-continuation-item-renderer');

            mapped.forEach(item => {
                container.insertBefore(item.el, spinner);
            });

            updateStats();
        });
    }

    /* --- INIT & WATCHER --- */
    setInterval(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            state.speed = 1.0; 
            
            const input = document.querySelector(`#${CONTAINER_ID} input[type="number"]`);
            if (input) input.value = "1.0";
        }

        if (window.location.href.includes('playlist') || window.location.href.includes('list=')) {
            injectToolbar();
            if (!state.isLoading) updateStats(); 
        } else {
            const el = document.getElementById(CONTAINER_ID);
            if(el) el.remove();
        }
    }, 2000);

})();
