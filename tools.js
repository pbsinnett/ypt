(function() {
    'use strict';

    const CONTAINER_ID = 'yt-tools-toolbar-v70';
    const STATUS_ID = 'yt-tools-status-v70';
    const SPAN_TOTAL_ID = 'yt-tools-text-total';
    const SPAN_PROG_ID = 'yt-tools-text-prog';
    const QUEUE_SPAN_PANEL = 'yt-tools-queue-duration-panel'; 
    const QUEUE_SPAN_MINI = 'yt-tools-queue-duration-mini'; 
    
    let state = { speed: 1.0, sortType: 'index', sortOrder: 'asc', isLoading: false, isSorting: false, mathSettleTimer: null, memoryVault: {} };
    let updateTimer = null;

    /* --- INJECT GLOBAL STYLES --- */
    if (!document.getElementById('yt-tools-global-styles')) {
        const style = document.createElement('style');
        style.id = 'yt-tools-global-styles';
        style.textContent = `
            /* ACTION BUTTONS */
            .yt-tools-actions-wrapper {
                display: flex;
                align-items: center;
                opacity: 1; 
                pointer-events: auto;
            }
            .yt-tools-custom-btn {
                background: transparent;
                border: none;
                cursor: pointer;
                color: var(--yt-spec-text-secondary, #606060);
                padding: 8px;
                margin-right: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.2s, color 0.2s;
            }
            .yt-tools-custom-btn:hover, .yt-tools-custom-btn:focus {
                background: var(--yt-spec-10-percent-layer, #e5e5e5);
                color: var(--yt-spec-text-primary, #0f0f0f);
                outline: none;
            }

            /* TOOLBAR DARK MODE UI */
            .yt-tools-toolbar {
                display: flex; align-items: center; flex-wrap: wrap; gap: 12px;
                margin: 0 0 16px 0; padding: 12px 16px; border-radius: 12px;
                width: 100%; max-width: 100%; box-sizing: border-box; z-index: 1000;
                font-family: "Roboto", "Arial", sans-serif;
                background: var(--yt-spec-badge-chip-background, rgba(0,0,0,0.05));
                border: 1px solid var(--yt-spec-10-percent-layer, rgba(0,0,0,0.1));
            }
            html[dark] .yt-tools-toolbar {
                background: var(--yt-spec-badge-chip-background, rgba(255,255,255,0.1));
                border-color: var(--yt-spec-10-percent-layer, rgba(255,255,255,0.1));
            }
            
            .yt-tools-pill-btn {
                background: var(--yt-spec-text-primary, #0f0f0f);
                color: var(--yt-spec-base-background, #fff);
                border: none; border-radius: 18px; padding: 6px 16px;
                cursor: pointer; font-size: 13px; font-weight: 500; transition: opacity 0.2s;
            }
            html[dark] .yt-tools-pill-btn {
                background: var(--yt-spec-text-primary, #f1f1f1);
                color: var(--yt-spec-base-background, #0f0f0f);
            }
            
            .yt-tools-input {
                background: transparent;
                color: var(--yt-spec-text-primary, #0f0f0f);
                padding: 4px 8px; border: 1px solid var(--yt-spec-10-percent-layer, rgba(0,0,0,0.1));
                border-radius: 8px; font-size: 13px; outline: none;
            }
            html[dark] .yt-tools-input {
                color: var(--yt-spec-text-primary, #f1f1f1);
                border-color: var(--yt-spec-10-percent-layer, rgba(255,255,255,0.2));
            }
            
            .yt-tools-input option {
                background: var(--yt-spec-base-background, #fff);
                color: var(--yt-spec-text-primary, #0f0f0f);
            }
            html[dark] .yt-tools-input option {
                background: var(--yt-spec-menu-background, #282828);
                color: var(--yt-spec-text-primary, #f1f1f1);
            }
            
            .yt-tools-text-secondary {
                font-size: 13px; color: var(--yt-spec-text-secondary, #606060);
            }
            html[dark] .yt-tools-text-secondary {
                color: var(--yt-spec-text-secondary, #aaaaaa);
            }

            .yt-tools-status-container {
                display: flex; align-items: center; margin-left: auto;
                font-size: 12px; color: var(--yt-spec-text-secondary, #606060); font-weight: 400;
            }
            html[dark] .yt-tools-status-container {
                color: var(--yt-spec-text-secondary, #aaaaaa);
            }

            .yt-tools-text-primary {
                font-weight: 500; color: var(--yt-spec-text-primary, #0f0f0f);
            }
            html[dark] .yt-tools-text-primary {
                color: var(--yt-spec-text-primary, #f1f1f1);
            }
            
            .yt-tools-separator {
                margin: 0 8px; color: var(--yt-spec-10-percent-layer, rgba(0,0,0,0.1));
            }
            html[dark] .yt-tools-separator {
                color: var(--yt-spec-10-percent-layer, rgba(255,255,255,0.2));
            }

            .yt-tools-duration-span {
                color: var(--yt-spec-text-secondary, #606060);
                font-size: 1.2rem; font-weight: 400; margin-left: 6px; display: inline-block;
            }
            html[dark] .yt-tools-duration-span {
                color: var(--yt-spec-text-secondary, #aaaaaa);
            }
            .yt-tools-duration-span-panel {
                font-size: 1.3rem; margin-left: 8px;
            }

            /* TRUE STEALTH CLOAK: Throws popups off-screen to silence Screen Readers */
            html.yt-tools-hide-popups ytd-popup-container tp-yt-iron-dropdown,
            html.yt-tools-hide-popups yt-confirm-dialog-renderer {
                opacity: 0 !important;
                pointer-events: none !important;
                visibility: hidden !important; 
                position: absolute !important;
                left: -9999px !important;
                top: -9999px !important;
            }
        `;
        document.head.appendChild(style);
    }

    /* --- DOM HELPER --- */
    function createEl(tag, className = '', text = null) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (text) el.innerHTML = text;
        return el;
    }

    /* --- ASYNC WAIT HELPER --- */
    const waitForElement = (selectorOrFn, timeout = 1200) => {
        return new Promise((resolve, reject) => {
            const check = () => typeof selectorOrFn === 'function' ? selectorOrFn() : document.querySelector(selectorOrFn);
            const el = check();
            if (el) return resolve(el);

            const waitObserver = new MutationObserver(() => {
                const foundEl = check();
                if (foundEl) { waitObserver.disconnect(); resolve(foundEl); }
            });
            waitObserver.observe(document.body, { childList: true, subtree: true });

            setTimeout(() => {
                waitObserver.disconnect();
                reject(new Error('Timeout'));
            }, timeout);
        });
    };

    /* --- ASYNC STEALTH MENU EXECUTOR --- */
    async function executeHiddenMenuAction(menuBtn, textPriorities, confirmSelector = null, callback = null) {
        document.documentElement.classList.add('yt-tools-hide-popups');
        
        const nativeFocus = HTMLElement.prototype.focus;
        HTMLElement.prototype.focus = function() {
            if (this === menuBtn || (this.closest && this.closest('ytd-popup-container'))) return;
            return nativeFocus.apply(this, arguments);
        };
        
        if (typeof mainObserver !== 'undefined') mainObserver.disconnect();
        
        menuBtn.click();

        try {
            await new Promise(r => setTimeout(r, 50));

            const targetOpt = await waitForElement(() => {
                const popup = document.querySelector('ytd-popup-container');
                if (!popup) return null;
                
                const dropdown = popup.querySelector('tp-yt-iron-dropdown');
                if (dropdown && dropdown.getAttribute('aria-hidden') === 'true') return null;
                
                const items = Array.from(popup.querySelectorAll('tp-yt-paper-item, ytd-menu-service-item-renderer, ytd-menu-navigation-item-renderer, yt-list-item-view-model'));
                for (const pref of textPriorities) {
                    const found = items.find(item => item.textContent.toLowerCase().includes(pref.toLowerCase()));
                    if (found) return found;
                }
                return null;
            }, 1000);

            const clickTarget = targetOpt.querySelector('button, a') || targetOpt.closest('a') || targetOpt;
            clickTarget.click();

            if (confirmSelector) {
                const confirmBtn = await waitForElement(confirmSelector, 1000);
                confirmBtn.click();
            } else {
                setTimeout(() => {
                    if (document.activeElement) document.activeElement.blur();
                    document.body.click();
                }, 50); 
            }

            if (callback) setTimeout(callback, 200);

        } catch (err) {
            document.body.click(); 
        } finally {
            setTimeout(() => {
                document.documentElement.classList.remove('yt-tools-hide-popups');
                HTMLElement.prototype.focus = nativeFocus;
                if (typeof startObserver === 'function') startObserver();
            }, 300);
        }
    }

    /* --- BULLETPROOF DURATION PARSER --- */
    function parseDurationFromText(text) {
        if (!text) return 0;
        
        if (text.includes('\u200B')) text = text.split('\u200B')[1];
        text = text.toLowerCase().trim().replace(/\s+/g, ' ');

        const timeMatch = text.match(/(?:^|\b)(\d+:\d{2}(?::\d{2})?)(?:\b|$)/);
        if (timeMatch) {
            const parts = timeMatch[1].split(':').map(Number);
            if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
            if (parts.length === 2) return parts[0] * 60 + parts[1];
            return parts[0];
        }

        const blockRegex = /(?:(?:^|\s)(\d+)\s*(?:hours|hour|hr))?[,\s]*(?:(?:^|\s)(\d+)\s*(?:minutes|minute|mins|min))?[,\s]*(?:(?:^|\s)(\d+)\s*(?:seconds|second|secs|sec))?/g;
        
        let lastValidSeconds = 0;
        let match;
        
        while ((match = blockRegex.exec(text)) !== null) {
            if (match.index === blockRegex.lastIndex) blockRegex.lastIndex++;
            
            let h = parseInt(match[1]) || 0;
            let m = parseInt(match[2]) || 0;
            let s = parseInt(match[3]) || 0;
            
            let currentSecs = (h * 3600) + (m * 60) + s;
            if (currentSecs > 0) {
                lastValidSeconds = currentSecs; 
            }
        }

        return lastValidSeconds;
    }

    function formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return "0:00";
        let h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = Math.floor(seconds % 60);
        const mStr = m.toString().padStart(2, '0'), sStr = s.toString().padStart(2, '0');
        return h > 0 ? `${h}:${mStr}:${sStr}` : `${m}:${sStr}`;
    }

    /* --- ACTIVE CONTAINER LOCATOR --- */
    function getActiveContainer() {
        const isVisible = (el) => (el && el.getBoundingClientRect().width > 0 && window.getComputedStyle(el).visibility !== 'hidden');

        const miniExpandBtn = document.querySelector('.ytdMiniplayerInfoBarExpand button');
        const isMiniExpanded = miniExpandBtn && miniExpandBtn.getAttribute('aria-expanded') === 'true';
        if (isMiniExpanded) {
            const miniPanel = document.querySelector('ytd-miniplayer ytd-playlist-panel-renderer #items.playlist-items');
            if (isVisible(miniPanel)) return { type: 'panel', itemsEl: miniPanel, el: miniPanel.closest('ytd-playlist-panel-renderer') };
        }

        const sidebarPanel = document.querySelector('ytd-watch-flexy #secondary ytd-playlist-panel-renderer#playlist #items.playlist-items');
        if (isVisible(sidebarPanel)) return { type: 'panel', itemsEl: sidebarPanel, el: sidebarPanel.closest('ytd-playlist-panel-renderer') };

        const pageList = document.querySelector('ytd-playlist-video-list-renderer #contents');
        
        // THE FIX: YouTube deletes the standard list when empty and renders this message instead.
        // We find the message, and anchor the toolbar directly to it!
        const emptyMessage = document.querySelector('ytd-browse[page-subtype="playlist"] ytd-message-renderer, ytd-section-list-renderer[page-subtype="playlist"] ytd-message-renderer');
        
        if (isVisible(pageList)) {
            return { type: 'page', itemsEl: pageList, el: pageList.closest('ytd-playlist-video-list-renderer') };
        } else if (isVisible(emptyMessage)) {
            return { type: 'page', itemsEl: emptyMessage, el: emptyMessage.closest('ytd-item-section-renderer') };
        }

        const subGrid = document.querySelector('ytd-browse[page-subtype="subscriptions"] #contents, ytd-browse #contents ytd-rich-grid-renderer #contents');
        if (isVisible(subGrid)) return { type: 'grid', itemsEl: subGrid, el: subGrid.closest('ytd-rich-grid-renderer') || subGrid };

        const allPanels = document.querySelectorAll('ytd-playlist-panel-renderer #items.playlist-items');
        for (let i = 0; i < allPanels.length; i++) {
            if (isVisible(allPanels[i])) return { type: 'panel', itemsEl: allPanels[i], el: allPanels[i].closest('ytd-playlist-panel-renderer') };
        }
        
        return null;
    }

    /* --- CLEAN DATA EXTRACTOR */
    function getVideoID(vid) {
        const links = Array.from(vid.querySelectorAll('a[href*="/watch?"]'));
        for (let link of links) {
            const match = link.href.match(/[?&]v=([^&]+)/);
            if (match) return match[1];
        }
        return null;
    }

    function getVideoData(vid, index) {
        try {
            const id = getVideoID(vid);
            
            let duration = 0;
            const badge = vid.querySelector('.yt-badge-shape__text, span#text.ytd-thumbnail-overlay-time-status-renderer, .badge-shape-wiz__text');
            if (badge && badge.textContent && badge.textContent.includes(':')) {
                duration = parseDurationFromText(badge.textContent);
            }

            if (duration === 0) {
                const titleHeader = vid.querySelector('h3, h4, #video-title');
                if (titleHeader) {
                    const aria = titleHeader.getAttribute('aria-label');
                    if (aria) duration = parseDurationFromText(aria);
                }
            }

            let progress = 0;
            if (vid.hasAttribute('percent-watched')) {
                progress = parseFloat(vid.getAttribute('percent-watched'));
            }
            
            if (progress === 0) {
                const potentialBars = vid.querySelectorAll('ytd-thumbnail-overlay-resume-playback-renderer #progress, ytd-thumbnail-overlay-resume-playback-renderer, .ytp-play-progress, .ytThumbnailOverlayProgressBarHostWatchedProgressBarSegment, #progress');
                for (let bar of potentialBars) {
                    let width = bar.style.width;
                    if (!width) width = bar.style.getPropertyValue('--yt-progress-bar-width'); 
                    
                    if (width && width.includes('%')) {
                        let val = parseFloat(width);
                        if (!isNaN(val) && val > 0) {
                            progress = val;
                            break;
                        }
                    }
                }
            }

            const titleEl = vid.querySelector('#video-title, .yt-lockup-metadata-view-model__title');
            let title = titleEl && titleEl.textContent ? titleEl.textContent.trim() : "";
            
            let originalIndex = parseInt(vid.getAttribute('data-original-index'));
            if (isNaN(originalIndex)) {
                vid.setAttribute('data-original-index', index || 0);
                originalIndex = index || 0;
            }

            let channel = "";
            const channelEl = vid.querySelector('.ytd-channel-name, #channel-name, .yt-core-attributed-string__link');
            if (channelEl && channelEl.textContent) channel = channelEl.textContent.trim();

            let dateVal = 0;
            let viewsVal = 0;

            const metaContainer = vid.querySelector('#metadata, .ytd-video-meta-block, .yt-lockup-metadata-view-model');
            
            if (metaContainer) {
                const fullText = metaContainer.textContent.toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, ' ');

                const dateMatch = fullText.match(/([\d\.]+)\s*(year|month|week|day|hour|min|sec|mo|y|w|d|h|m|s)[a-z]*\s*ago/);
                if (dateMatch) {
                    const v = parseFloat(dateMatch[1]);
                    const u = dateMatch[2];
                    if (u.startsWith('y')) dateVal = v * 525600;
                    else if (u.startsWith('mo')) dateVal = v * 43200;
                    else if (u.startsWith('w')) dateVal = v * 10080;
                    else if (u.startsWith('d')) dateVal = v * 1440;
                    else if (u.startsWith('h')) dateVal = v * 60;
                    else if (u.startsWith('m')) dateVal = v;
                    else if (u.startsWith('s')) dateVal = v / 60;
                }

                const parts = fullText.split(/[•·|]/).map(p => p.trim());
                for (let p of parts) {
                    if (p.includes('view') || p.match(/^[\d\.,]+[kmbt]?$/)) {
                        const cleanP = p.replace(/[\s,]+/g, '');
                        if (cleanP.includes('no')) {
                            viewsVal = 0;
                            break;
                        }
                        const vMatch = cleanP.match(/([\d\.]+)([kmbt]?)/);
                        if (vMatch) {
                            const val = parseFloat(vMatch[1]);
                            const mult = vMatch[2];
                            if (mult === 'k') viewsVal = val * 1000;
                            else if (mult === 'm') viewsVal = val * 1000000;
                            else if (mult === 'b') viewsVal = val * 1000000000;
                            else viewsVal = val;
                            break;
                        }
                    }
                }
            }

            if (id) {
                if (!state.memoryVault[id]) state.memoryVault[id] = {};
                
                if (duration > 0) state.memoryVault[id].duration = duration;
                if (progress > 0) state.memoryVault[id].progress = progress;
                if (viewsVal > 0) state.memoryVault[id].views = viewsVal;
                if (dateVal > 0) state.memoryVault[id].date = dateVal;
                if (title) state.memoryVault[id].title = title;
                if (channel) state.memoryVault[id].channel = channel;
                
                if (duration === 0) duration = state.memoryVault[id].duration || 0;
                if (progress === 0) progress = state.memoryVault[id].progress || 0;
                if (viewsVal === 0) viewsVal = state.memoryVault[id].views || 0;
                if (dateVal === 0) dateVal = state.memoryVault[id].date || 0;
                if (!title) title = state.memoryVault[id].title || "";
                if (!channel) channel = state.memoryVault[id].channel || "";
            }

            return { duration, progress, title, channel, dateVal, viewsVal, originalIndex, element: vid };

        } catch (e) {
            return { duration: 0, progress: 0, title: "", channel: "", dateVal: 0, viewsVal: 0, originalIndex: index || 0, element: vid };
        }
    }

    /* --- NON-DESTRUCTIVE CLEANER --- */
    function cleanAndGetRows() {
        const active = getActiveContainer();
        if (!active || !active.itemsEl) return { container: null, rows: [] };
        
        const container = active.itemsEl;
        const rawRows = Array.from(container.querySelectorAll('ytd-playlist-video-renderer, ytd-playlist-panel-video-renderer, ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-rich-grid-media'));

        const seenIds = new Set();
        const uniqueRows = [];

        rawRows.forEach(row => {
            if (row.classList.contains('yt-tools-deleted')) return;

            const id = getVideoID(row);
            if (!id) {
                uniqueRows.push(row);
                return; 
            }

            if (seenIds.has(id)) {
                row.style.display = 'none'; 
            } else {
                seenIds.add(id);
                row.style.display = ''; 
                uniqueRows.push(row);
            }
        });

        return { container, rows: uniqueRows };
    }

    /* --- AUTO SCROLLER --- */
    async function loadAllVideos() {
        if (state.isLoading) return; 
        state.isLoading = true;

        const spanTotal = document.getElementById(SPAN_TOTAL_ID);

        try {
            const active = getActiveContainer();
            if (!active || !active.itemsEl) return;

            const container = active.itemsEl;

            while (state.isLoading) {
                const currentElements = container.querySelectorAll('ytd-playlist-video-renderer, ytd-playlist-panel-video-renderer, ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-rich-grid-media');
                const beforeCount = currentElements.length;
                
                if (spanTotal) spanTotal.textContent = `Loading... (${beforeCount} found)`;
                
                if (active.type === 'panel') {
                    container.scrollTop = container.scrollHeight;
                } else {
                    window.scrollTo(0, document.documentElement.scrollHeight);
                }
                
                await new Promise((resolve) => {
                    let timeout;
                    const loadObserver = new MutationObserver(() => {
                        const afterCount = container.querySelectorAll('ytd-playlist-video-renderer, ytd-playlist-panel-video-renderer, ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-rich-grid-media').length;
                        if (afterCount > beforeCount) {
                            loadObserver.disconnect();
                            clearTimeout(timeout);
                            resolve();
                        }
                    });

                    loadObserver.observe(container, { childList: true, subtree: true });

                    timeout = setTimeout(() => {
                        loadObserver.disconnect();
                        resolve();
                    }, 2500);
                });

                const continuationElement = container.querySelector('ytd-continuation-item-renderer');
                const afterElements = container.querySelectorAll('ytd-playlist-video-renderer, ytd-playlist-panel-video-renderer, ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-rich-grid-media');
                if (!continuationElement || afterElements.length === beforeCount) break; 
            }
        } catch (e) {
            console.error("Load failed", e);
        } finally {
            state.isLoading = false;
            
            // Just run the update immediately and snap to the top
            updateAll();
            
            const active = getActiveContainer();
            if (active) {
                if (active.type === 'panel') active.itemsEl.scrollTop = 0;
                else window.scrollTo(0, 0);
            }
        }
    }

    /* --- QUEUE DURATION --- */
    function updateQueueDuration() {
        const miniTitle = document.querySelector('.ytdMiniplayerInfoBarSubtitle h1');
        const miniPanel = document.querySelector('ytd-miniplayer ytd-playlist-panel-renderer #items.playlist-items');
        
        if (miniPanel && miniTitle && miniTitle.getBoundingClientRect().width > 0) {
            let totalSec = 0;
            const items = miniPanel.querySelectorAll('ytd-playlist-panel-video-renderer');
            items.forEach(row => {
                if (!row.classList.contains('yt-tools-deleted')) {
                    const timeSpan = row.querySelector('.ytd-thumbnail-overlay-time-status-renderer, .badge-shape-wiz__text');
                    if (timeSpan) totalSec += parseDurationFromText(timeSpan.textContent);
                }
            });

            const formattedTime = totalSec > 0 ? `• ${formatTime(totalSec)}` : '';
            let miniSpan = document.getElementById(QUEUE_SPAN_MINI);
            if (!miniSpan) {
                miniSpan = createEl('span', 'yt-tools-duration-span');
                miniSpan.id = QUEUE_SPAN_MINI;
                miniTitle.parentNode.insertBefore(miniSpan, miniTitle.nextSibling);
            }
            miniSpan.textContent = formattedTime;
        }

        const panelTitle = document.querySelector('ytd-watch-flexy #secondary ytd-playlist-panel-renderer#playlist #header-description h3 .title, #title-text, .title.ytd-playlist-panel-renderer'); 
        const sidebarPanel = document.querySelector('ytd-watch-flexy #secondary ytd-playlist-panel-renderer#playlist #items.playlist-items');
        
        if (panelTitle && sidebarPanel) {
            let totalSec = 0;
            const items = sidebarPanel.querySelectorAll('ytd-playlist-panel-video-renderer');
            items.forEach(row => {
                if (!row.classList.contains('yt-tools-deleted')) {
                    const timeSpan = row.querySelector('.ytd-thumbnail-overlay-time-status-renderer, .badge-shape-wiz__text');
                    if (timeSpan) totalSec += parseDurationFromText(timeSpan.textContent);
                }
            });

            const formattedTime = totalSec > 0 ? `• ${formatTime(totalSec)}` : '';
            let panelSpan = document.getElementById(QUEUE_SPAN_PANEL);
            if (!panelSpan) {
                panelSpan = createEl('span', 'yt-tools-duration-span yt-tools-duration-span-panel');
                panelSpan.id = QUEUE_SPAN_PANEL;
                const insertTarget = panelTitle.tagName.toLowerCase() === 'yt-formatted-string' && panelTitle.parentNode.tagName.toLowerCase() === 'h3' ? panelTitle.parentNode : panelTitle;
                insertTarget.parentNode.insertBefore(panelSpan, insertTarget.nextSibling);
            }
            panelSpan.textContent = formattedTime;
        }
    }

    /* --- NATIVE PLAYLIST HEADER INJECTION --- */
    function injectPlaylistHeaderButtons(watchedSec = 0) {
        const isWatchLater = window.location.href.includes('list=WL');
        if (!isWatchLater) return;

        const wrapper = document.querySelector('ytd-playlist-header-renderer .metadata-buttons-wrapper');
        const menuRenderer = wrapper?.querySelector('ytd-menu-renderer');
        let btnRemove = document.getElementById('yt-tools-clean-watched-btn');
        
        if (watchedSec <= 0 || isNaN(watchedSec)) {
            if (btnRemove) btnRemove.remove();
            return;
        }

        if (wrapper && menuRenderer && !btnRemove) {
            btnRemove = document.createElement('button');
            btnRemove.id = 'yt-tools-clean-watched-btn';
            btnRemove.className = 'yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--overlay yt-spec-button-shape-next--size-m';
            btnRemove.style.marginLeft = '8px';
            btnRemove.style.marginRight = '8px';
            btnRemove.innerHTML = `<div class="yt-spec-button-shape-next__button-text-content"><span class="yt-core-attributed-string yt-core-attributed-string--white-space-no-wrap" role="text">Remove Watched</span></div>`;
            
            btnRemove.onclick = (e) => {
                e.preventDefault();
                const playlistMenuBtn = menuRenderer.querySelector('yt-icon-button button') || menuRenderer.querySelector('button[aria-label="Action menu"]');
                if (playlistMenuBtn) {
                    executeHiddenMenuAction(
                        playlistMenuBtn, 
                        ['remove watched'],
                        'yt-confirm-dialog-renderer #confirm-button button, #confirm-button > yt-button-shape > button',
                        () => updateAll()
                    );
                }
            };
            wrapper.insertBefore(btnRemove, menuRenderer.nextSibling);
        }
    }

    /* --- UI BUILDER & TELEPORTATION --- */
    function injectToolbar(active) {
        if (!active || !active.itemsEl) return;

        let container = document.getElementById(CONTAINER_ID);
        
        if (container) {
            // If the toolbar is already exactly where it belongs, do nothing.
            if (container.nextElementSibling === active.itemsEl) {
                return; 
            }
            
            // Teleport the toolbar to the new location
            active.itemsEl.parentNode.insertBefore(container, active.itemsEl);
            
            // Reset the sorting dropdowns
            state.sortType = 'index';
            state.sortOrder = 'asc';
            const sortSelect = container.querySelector('.yt-tools-sort-select');
            const dirSelect = container.querySelector('.yt-tools-dir-select');
            if (sortSelect) sortSelect.value = 'index';
            if (dirSelect) dirSelect.value = 'asc';
            
            // THE FIX: Wipe the visible text AND the invisible memory cache!
            const spanTotal = document.getElementById(SPAN_TOTAL_ID);
            const spanProg = document.getElementById(SPAN_PROG_ID);
            if (spanTotal) {
                spanTotal.textContent = ""; 
                spanTotal.removeAttribute('data-pending-text');
            }
            if (spanProg) {
                spanProg.textContent = "";
                spanProg.removeAttribute('data-pending-text');
            }

            return; 
        }

        container = createEl('div', 'yt-tools-toolbar');
        container.id = CONTAINER_ID;

        const loadBtn = createEl('button', 'yt-tools-pill-btn', 'Load All');
        loadBtn.onmouseenter = () => loadBtn.style.opacity = '0.8';
        loadBtn.onmouseleave = () => loadBtn.style.opacity = '1';
        loadBtn.onclick = (e) => { e.preventDefault(); loadAllVideos(); };

        const sortSelect = createEl('select', 'yt-tools-input yt-tools-sort-select');
        const sortOptions = [
            { value: 'index', label: 'Index (default)' },
            { value: 'channel', label: 'Channel' },
            { value: 'date', label: 'Date' },
            { value: 'duration', label: 'Duration' },
            { value: 'title', label: 'Title' },
            { value: 'views', label: 'View Count' },
            { value: 'progress', label: 'Watched Progress' }
        ];
        sortOptions.forEach(opt => {
            const o = document.createElement('option');
            o.value = opt.value; o.textContent = opt.label;
            if(state.sortType === opt.value) o.selected = true;
            sortSelect.appendChild(o);
        });

        const dirSelect = createEl('select', 'yt-tools-input yt-tools-dir-select');
        [['asc', 'Ascending'], ['desc', 'Descending']].forEach(opt => {
            const o = document.createElement('option');
            o.value = opt[0]; o.textContent = opt[1];
            if(state.sortOrder === opt[0]) o.selected = true;
            dirSelect.appendChild(o);
        });

        const speedInput = createEl('input', 'yt-tools-input');
        speedInput.type = 'number'; 
        speedInput.value = state.speed; 
        speedInput.step = '0.01'; 
        speedInput.min = '0.07'; 
        speedInput.max = '16'; 
        speedInput.style.width = '55px'; 
        speedInput.style.textAlign = 'center';

        const statusContainer = createEl('div', 'yt-tools-status-container');
        statusContainer.id = STATUS_ID;

        const spanTotal = createEl('span', 'yt-tools-text-primary', '');
        spanTotal.id = SPAN_TOTAL_ID;
        spanTotal.setAttribute('aria-live', 'polite');
        spanTotal.setAttribute('aria-atomic', 'true');

        const spanSep = createEl('span', 'yt-tools-separator', '|');
        
        const spanProg = createEl('span', 'yt-tools-text-secondary', '');
        spanProg.id = SPAN_PROG_ID;
        spanProg.setAttribute('aria-live', 'polite');
        spanProg.setAttribute('aria-atomic', 'true');

        statusContainer.appendChild(spanTotal);
        statusContainer.appendChild(spanSep);
        statusContainer.appendChild(spanProg);

        container.appendChild(loadBtn); 
        container.appendChild(createEl('span', 'yt-tools-text-secondary', 'Sort:'));
        container.appendChild(sortSelect);
        container.appendChild(dirSelect);
        container.appendChild(createEl('span', 'yt-tools-text-secondary', 'Speed:'));
        container.appendChild(speedInput);
        container.appendChild(statusContainer);

        active.itemsEl.parentNode.insertBefore(container, active.itemsEl);

        sortSelect.onchange = (e) => { state.sortType = e.target.value; runSort(); };
        dirSelect.onchange = (e) => { state.sortOrder = e.target.value; runSort(); };
        
        speedInput.oninput = (e) => { 
            let val = parseFloat(e.target.value);
            if (isNaN(val) || val < 0) return; 
            
            if (val > 16) {
                val = 16;
                e.target.value = 16;
            }
            
            let activeSpeed = val;
            if (activeSpeed < 0.07) activeSpeed = 0.07;
            
            state.speed = activeSpeed;
            
            const player = document.getElementById('movie_player');
            if (player && typeof player.setPlaybackRate === 'function') {
                player.setPlaybackRate(state.speed);
            } else {
                const video = document.querySelector('video.html5-main-video');
                if (video) video.playbackRate = state.speed;
            }
            updateAll(); 
        };
        
        speedInput.onblur = (e) => {
            let val = parseFloat(e.target.value);
            if (isNaN(val) || val < 0.07) e.target.value = 0.07;
        }
    }

    /* --- GLOBAL ACCESSIBILITY FIXES --- */
    function fixGlobalAccessibility() {
        const infoBar = document.querySelector('ytd-miniplayer-info-bar');
        
        if (infoBar && !infoBar.dataset.ytToolsGuarded) {
            infoBar.dataset.ytToolsGuarded = 'true';
            const targetLabel = 'Miniplayer queue'; 
            
            const enforceLabel = () => {
                const btn = infoBar.querySelector('button');
                if (btn) {
                    if (btn.getAttribute('aria-label') !== targetLabel) {
                        btn.setAttribute('aria-label', targetLabel);
                        btn.title = targetLabel;
                    }

                    if (!btn.querySelector('.yt-tools-sr-span')) {
                        const srSpan = document.createElement('span');
                        srSpan.className = 'yt-tools-sr-span'; 
                        srSpan.textContent = targetLabel;
                        srSpan.style.cssText = 'position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); border: 0;';
                        btn.appendChild(srSpan);
                    }
                }
            };

            enforceLabel();

            const attributeGuard = new MutationObserver(enforceLabel);
            attributeGuard.observe(infoBar, { 
                childList: true,     
                subtree: true,       
                attributes: true,    
                attributeFilter: ['aria-label', 'title'] 
            });
        }
    }

    /* --- GLOBAL COMPONENT INJECTION --- */
    function injectRowModifications() {
        const allRows = document.querySelectorAll('ytd-playlist-video-renderer, ytd-playlist-panel-video-renderer, ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-rich-grid-media');
        const isWatchLaterPage = window.location.href.includes('list=WL');

        const createBtn = (actionsWrapper, row, btnClass, svg, title, clickPriorities, isDelete = false) => {
            let btn = actionsWrapper.querySelector(`.${btnClass}`);
            if (!btn) {
                btn = document.createElement('button');
                btn.className = `yt-tools-custom-btn ${btnClass}`;
                btn.title = title;
                btn.setAttribute('aria-label', title);
                btn.innerHTML = svg;
                
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    btn.blur(); 
                    
                    if (isDelete) {
                        row.style.opacity = '0.3'; 
                        row.style.pointerEvents = 'none';
                        row.classList.add('yt-tools-deleted');
                    }
                    
                    const menuBtn = row.querySelector('button[aria-label="Action menu"], button[aria-label="More actions"], #menu yt-icon-button, yt-icon-button button'); 

                    if (menuBtn) {
                        executeHiddenMenuAction(menuBtn, clickPriorities, null, isDelete ? () => {
                            row.style.display = 'none'; 
                            updateAll();
                        } : () => {
                            updateAll(); 
                        });
                    }
                };
                actionsWrapper.appendChild(btn);
            }
        };

        allRows.forEach((row, i) => {
            if (row.classList.contains('yt-tools-deleted')) return;

            const data = getVideoData(row, i);
            const isMiniplayer = row.closest('ytd-miniplayer') !== null;
            const isGrid = row.tagName.toLowerCase().includes('grid') || row.tagName.toLowerCase().includes('rich');
            const isPlaying = row.hasAttribute('selected');

            const titleAnchor = row.querySelector('#video-title, .yt-lockup-metadata-view-model__title');
            if (titleAnchor) {
                const headingParent = titleAnchor.closest('h3, h4');
                
                let baseText = "";
                if (headingParent && headingParent.hasAttribute('aria-label')) {
                    baseText = headingParent.getAttribute('aria-label');
                } else if (titleAnchor.hasAttribute('aria-label')) {
                    baseText = titleAnchor.getAttribute('aria-label');
                } else {
                    baseText = titleAnchor.getAttribute('title') || titleAnchor.textContent.trim();
                }
                
                if (baseText.includes('\u200B')) {
                    baseText = baseText.split('\u200B')[1].trim();
                }

                let newAria;
                if (data.progress > 0) {
                    const progText = data.progress >= 100 ? "Watched:" : `${Math.round(data.progress)}% watched:`;
                    newAria = `${progText} \u200B${baseText}`;
                } else {
                    newAria = `\u200B${baseText}`; 
                }

                if (headingParent && headingParent.getAttribute('aria-label') !== newAria) {
                    headingParent.setAttribute('aria-label', newAria);
                }
                if (titleAnchor.getAttribute('aria-label') !== newAria) {
                    titleAnchor.setAttribute('aria-label', newAria);
                }
            }
            
            const menuRenderer = row.querySelector('ytd-menu-renderer');
            const lockupMenu = row.querySelector('.yt-lockup-metadata-view-model__menu-button');
            const fallbackMenu = row.querySelector('#menu');
            const menuContainer = (menuRenderer ? menuRenderer.parentElement : null) || lockupMenu || fallbackMenu;

            if (menuContainer && !menuContainer.hasAttribute('hidden')) {
                let actionsWrapper = row.querySelector('.yt-tools-actions-wrapper');
                if (!actionsWrapper) {
                    menuContainer.style.display = 'flex';
                    menuContainer.style.alignItems = 'center';
                    menuContainer.style.flexDirection = 'row';
                    actionsWrapper = document.createElement('div');
                    actionsWrapper.className = 'yt-tools-actions-wrapper';
                    menuContainer.prepend(actionsWrapper);
                }

                if (!isMiniplayer) {
                    createBtn(actionsWrapper, row, 'yt-tools-q-btn', `<svg viewBox="0 0 24 24" style="width: 24px; height: 24px; fill: currentColor;"><path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"></path></svg>`, 'Add to queue', ['add to queue'], false);
                    
                    if (!isWatchLaterPage) {
                        createBtn(actionsWrapper, row, 'yt-tools-wl-btn', `<svg viewBox="0 0 24 24" style="width: 24px; height: 24px; fill: currentColor;"><path d="M14.97 16.95L10 13.87V7h2v5.76l4.03 2.49-1.06 1.7z M12 3c-4.96 0-9 4.04-9 9s4.04 9 9 9 9-4.04 9-9-4.04-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z"></path></svg>`, 'Save to Watch Later', ['save to watch later'], false);
                    } else {
                        const wlBtn = actionsWrapper.querySelector('.yt-tools-wl-btn');
                        if (wlBtn) wlBtn.remove();
                    }
                } else {
                    const qBtn = actionsWrapper.querySelector('.yt-tools-q-btn');
                    const wlBtn = actionsWrapper.querySelector('.yt-tools-wl-btn');
                    if (qBtn) qBtn.remove();
                    if (wlBtn) wlBtn.remove();
                }

                const showTrash = !isMiniplayer || (isMiniplayer && !isPlaying);
                if (showTrash) {
                    const btnTitle = isGrid ? 'Hide video' : (isMiniplayer ? 'Remove from queue' : 'Remove video');
                    const btnPriorities = isGrid ? ['hide', 'not interested'] : ['remove from watch later', 'remove from playlist', 'remove from queue', 'remove from', 'remove'];
                    const btnIcon = isGrid 
                        ? `<svg viewBox="0 0 24 24" style="width: 24px; height: 24px; fill: currentColor;"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>`
                        : `<svg viewBox="0 0 24 24" style="width: 24px; height: 24px; fill: currentColor;"><path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"></path></svg>`;

                    createBtn(actionsWrapper, row, 'yt-tools-t-btn', btnIcon, btnTitle, btnPriorities, true);
                } else {
                    const tBtn = actionsWrapper.querySelector('.yt-tools-t-btn');
                    if (tBtn) tBtn.remove();
                }
            }
        });
    }

    /* --- MASTER UPDATE CONTROLLER (Debounced) --- */
    function updateToolbarStats() {
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
            const currentCount = rows.length;

            if (currentCount === 0) {
                const totalText = "No videos found.";
                const progText = "";

                // 1. Check if we already scheduled this text. If yes, back away slowly.
                if (spanTotal.getAttribute('data-pending-text') === totalText) {
                    return; 
                }

                // 2. Lock in the memory
                spanTotal.setAttribute('data-pending-text', totalText);
                spanProg.setAttribute('data-pending-text', progText);

                // 3. Clear any OLD timers and start the fresh 800ms countdown
                clearTimeout(state.mathSettleTimer);
                state.mathSettleTimer = setTimeout(() => {
                    spanTotal.textContent = totalText;
                    spanProg.textContent = progText;
                }, 800);
                
                injectPlaylistHeaderButtons(0);
                return;
            }

            let totalSec = 0; let watchedSec = 0; let validVideos = 0;

            rows.forEach((row, i) => {
                const data = getVideoData(row, i);
                
                if (isNaN(data.duration)) data.duration = 0;
                if (isNaN(data.viewsVal)) data.viewsVal = 0;

                if (data.duration > 0) {
                    totalSec += data.duration;
                    validVideos++;
                    if (data.progress > 0) watchedSec += (data.duration * (data.progress / 100));
                }
            });

            injectPlaylistHeaderButtons(watchedSec);

            const remaining = (totalSec - watchedSec) / state.speed;
            const scaledTotal = totalSec / state.speed;
            
            let pctNum = totalSec > 0 ? (watchedSec/totalSec)*100 : 0;
            let pct = pctNum.toFixed(0);
            if (watchedSec > 0 && pct === "0") pct = "1"; 
            if (watchedSec < totalSec && pct === "100") pct = "99";

            const totalText = `Total: ${validVideos} vids (${formatTime(scaledTotal)} at ${state.speed}x)`;
            const progText = `Progress: ${pct}% (${formatTime(remaining)} left)`;

            if (spanTotal.getAttribute('data-pending-text') === totalText && spanProg.getAttribute('data-pending-text') === progText) {
                return; 
            }

            spanTotal.setAttribute('data-pending-text', totalText);
            spanProg.setAttribute('data-pending-text', progText);

            clearTimeout(state.mathSettleTimer);
            state.mathSettleTimer = setTimeout(() => {
                spanTotal.textContent = totalText;
                spanProg.textContent = progText;
                spanProg.style.color = (pct === "100") ? '#4caf50' : '';
            }, 800);

        } catch (e) {
            console.error(e);
        }
    }

    function updateAll() {
        if (state.isLoading || state.isSorting) return; 
        
        fixGlobalAccessibility(); 
        injectRowModifications();
        updateQueueDuration();
        updateToolbarStats();
    }

    function runSort() {
        state.isSorting = true;

        requestAnimationFrame(() => {
            try {
                const { container, rows } = cleanAndGetRows();
                if (!container) return;

                const mapped = rows.map((el, i) => ({ el, data: getVideoData(el, i) }));

                mapped.sort((a, b) => {
                    let vA, vB;
                    if (state.sortType === 'index') { vA = a.data.originalIndex; vB = b.data.originalIndex; }
                    else if (state.sortType === 'title') { vA = a.data.title.toLowerCase(); vB = b.data.title.toLowerCase(); }
                    else if (state.sortType === 'channel') { vA = a.data.channel.toLowerCase(); vB = b.data.channel.toLowerCase(); } 
                    else if (state.sortType === 'progress') { vA = a.data.progress; vB = b.data.progress; }
                    else if (state.sortType === 'date') { vA = a.data.dateVal; vB = b.data.dateVal; }
                    else if (state.sortType === 'views') { vA = a.data.viewsVal; vB = b.data.viewsVal; } 
                    else { vA = a.data.duration; vB = b.data.duration; }

                    if (vA < vB) return state.sortOrder === 'asc' ? -1 : 1;
                    if (vA > vB) return state.sortOrder === 'asc' ? 1 : -1;
                    return 0;
                });

                const spinner = container.querySelector('ytd-continuation-item-renderer');
                mapped.forEach(item => {
                    container.insertBefore(item.el, spinner);
                });
            } finally {
                state.isSorting = false;
                updateAll();
            }
        });
    }

    /* --- EVENT-DRIVEN CONTROLLERS (Fast Observers) --- */
    document.addEventListener('ratechange', (e) => {
        if (e.target && e.target.tagName && e.target.tagName.toLowerCase() === 'video') {
            const newSpeed = e.target.playbackRate;
            if (state.speed !== newSpeed) {
                state.speed = newSpeed;
                const input = document.querySelector(`#${CONTAINER_ID} input[type="number"]`);
                
                if (input && document.activeElement !== input) {
                    input.value = newSpeed;
                }
                
                const spanTotal = document.getElementById(SPAN_TOTAL_ID);
                if(spanTotal) spanTotal.removeAttribute('data-pending-text');

                updateAll();
            }
        }
    }, true);

    const mainObserver = new MutationObserver((mutations) => {
        if (state.isSorting || state.isLoading) return; 

        let needsUpdate = false;
        let isExpansion = false;

        for (const mutation of mutations) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'aria-expanded') {
                needsUpdate = true;
                if (mutation.target.getAttribute('aria-expanded') === 'true') {
                    isExpansion = true;
                }
                break;
            }

            if (mutation.addedNodes.length) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 && node.tagName && node.tagName.includes('YTD-')) {
                        needsUpdate = true;
                        break;
                    }
                }
            }
            if (needsUpdate) break;
        }

        if (needsUpdate) {
            mainObserver.disconnect();
            clearTimeout(updateTimer);

            const delay = isExpansion ? 600 : 300;

            updateTimer = setTimeout(() => {
                const active = getActiveContainer();
                if (active) {
                    injectToolbar(active);
                    
                    if(isExpansion || (mutations[0] && mutations[0].attributeName === 'aria-expanded')) {
                        const spanTotal = document.getElementById(SPAN_TOTAL_ID);
                        if(spanTotal) spanTotal.removeAttribute('data-pending-text');
                    }

                    updateAll();
                } else {
                    const tb = document.getElementById(CONTAINER_ID);
                    if (tb) tb.remove();
                }
                startObserver();
            }, delay);
        }
    });

    function startObserver() {
        mainObserver.observe(document.body, { 
            childList: true, 
            subtree: true, 
            attributes: true, 
            attributeFilter: ['aria-expanded'] 
        });
    }

    startObserver();

    document.addEventListener('yt-navigate-finish', () => {
        const video = document.querySelector('video.html5-main-video');
        state.speed = video ? video.playbackRate : 1.0; 
        const input = document.querySelector(`#${CONTAINER_ID} input[type="number"]`);
        
        if (input && document.activeElement !== input) {
            input.value = state.speed;
        }
        
        mainObserver.disconnect();
        setTimeout(() => {
            const active = getActiveContainer();
            if (active) injectToolbar(active);
            updateAll();
            startObserver();
        }, 500);
    });

})();