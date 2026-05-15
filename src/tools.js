(function () {
    'use strict';

    // ─── Default Configuration (Fallback) ─────────────────────────────────────
    const DEFAULT_CONFIG = {
        home: { active: ['queue', 'watchLater', 'notInterested'] },
        search: { active: ['queue', 'watchLater'] },
        watchLater: { active: ['removeWl', 'moveTop', 'moveBot'] },
        playlist: { active: ['removePlaylist', 'moveTop', 'moveBot'] },
        subscriptions: { active: ['queue', 'watchLater', 'hide'] },
        likedVideos: { active: ['queue', 'watchLater', 'removeLiked'] },
        watchHistory: { active: ['queue', 'watchLater', 'removeHistory'] },
        youHistoryShelf: { active: ['queue', 'watchLater', 'removeHistory'] },
        youPlaylistsShelf: { active: ['edit', 'delete'] },
        youWatchLaterShelf: { active: ['queue', 'playlist', 'removeWl'] },
        youLikedVideosShelf: { active: ['queue', 'watchLater', 'playlist'] },
        yourProfileHome: { active: ['queue', 'watchLater', 'promote'] },
        otherProfileHome: { active: ['queue', 'watchLater', 'share'] },
        yourProfileVideos: { active: ['queue', 'watchLater', 'promote'] },
        otherProfileVideos: { active: ['queue', 'watchLater', 'share'] },
        yourProfilePlaylists: { active: ['edit', 'delete'] },
        otherProfilePlaylists: { active: [] },
        otherProfileLive: { active: ['queue', 'watchLater', 'share'] },
        watch: { active: ['queue', 'watchLater', 'notInterested'] }
    };

    let USER_CONFIG = {}; 

    // ─── Initialize Extension ─────────────────────────────────────────────────
    chrome.storage.sync.get({ ytBtnConfig: DEFAULT_CONFIG }, (storageData) => {
        USER_CONFIG = storageData.ytBtnConfig;

        // ─── Constants ────────────────────────────────────────────────────────
        const CONTAINER_ID      = 'yt-tools-toolbar-v70';
        const STATUS_ID         = 'yt-tools-status-v70';
        const SPAN_TOTAL_ID     = 'yt-tools-text-total';
        const SPAN_PROG_ID      = 'yt-tools-text-prog';
        const QUEUE_SPAN_PANEL  = 'yt-tools-queue-duration-panel';
        const QUEUE_SPAN_MINI   = 'yt-tools-queue-duration-mini';

        const ROW_SELECTOR = [
            'ytd-playlist-video-renderer', 'ytd-playlist-panel-video-renderer', 'ytd-rich-item-renderer',
            'ytd-grid-video-renderer', 'ytd-rich-grid-media', 'ytd-video-renderer', 'ytd-compact-video-renderer',
            'ytd-playlist-renderer', 'ytd-grid-playlist-renderer', 'yt-lockup-view-model',
            'ytd-movie-renderer', 'ytd-grid-movie-renderer'
        ].join(', ');

        // ─── State ────────────────────────────────────────────────────────────
        const state = {
            speed: 1.0, sortType: 'index', sortOrder: 'asc', isSorting: false, isNavigating: false,
            memoryVault: {}, lastContainer: null, loadInterval: null, snapshotCounter: 0,
            initialWatchedChecked: false, allowRemoveBtn: false, lastTotalText: '', lastProgText: ''
        };
        let updateTimer = null;

        // ─── Button Factory ───────────────────────────────────────────────────
        const ICON_STYLE = 'width:20px;height:20px;fill:currentColor;';
        const SVG = {
            queue: `<svg viewBox="0 0 24 24" style="${ICON_STYLE}"><path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"/></svg>`,
            wl:    `<svg viewBox="0 0 24 24" style="${ICON_STYLE}"><path d="M14.97 16.95L10 13.87V7h2v5.76l4.03 2.49-1.06 1.7z M12 3c-4.96 0-9 4.04-9 9s4.04 9 9 9 9-4.04 9-9-4.04-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z"/></svg>`,
            hide:  `<svg viewBox="0 0 24 24" style="${ICON_STYLE}"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
            trash: `<svg viewBox="0 0 24 24" style="${ICON_STYLE}"><path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/></svg>`,
            edit:  `<svg viewBox="0 0 24 24" style="${ICON_STYLE}"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
            playlist: `<svg viewBox="0 0 24 24" style="${ICON_STYLE}"><path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"/></svg>`, 
            download: `<svg viewBox="0 0 24 24" style="${ICON_STYLE}"><path d="M17 9l-5 5-5-5h3V4h4v5h3zm2 9H5v-2h14v2z"/></svg>`,
            mobile: `<svg viewBox="0 0 24 24" style="${ICON_STYLE}"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>`,
            share: `<svg viewBox="0 0 24 24" style="${ICON_STYLE}"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>`,
            block: `<svg viewBox="0 0 24 24" style="${ICON_STYLE}"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"/></svg>`,
            up: `<svg viewBox="0 0 24 24" style="${ICON_STYLE}"><path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/></svg>`,
            down: `<svg viewBox="0 0 24 24" style="${ICON_STYLE}"><path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z"/></svg>`,
            promote: `<svg viewBox="0 0 24 24" style="${ICON_STYLE}"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`
        };

        const BUTTON_FACTORY = {
            queue: { class: 'yt-tools-q-btn', svg: SVG.queue, title: 'Add to queue', priorities: ['add to queue'], isDelete: false },
            watchLater: { class: 'yt-tools-wl-btn', svg: SVG.wl, title: 'Save to Watch Later', priorities: ['save to watch later'], isDelete: false },
            playlist: { class: 'yt-tools-pl-btn', svg: SVG.playlist, title: 'Save to playlist', priorities: ['save to playlist'], isDelete: false },
            download: { class: 'yt-tools-dl-btn', svg: SVG.download, title: 'Download', priorities: ['download'], isDelete: false },
            downloadMobile: { class: 'yt-tools-dlm-btn', svg: SVG.mobile, title: 'Download to Mobile', priorities: ['download to mobile', 'download'], isDelete: false },
            share: { class: 'yt-tools-sh-btn', svg: SVG.share, title: 'Share', priorities: ['share'], isDelete: false },
            notInterested: { class: 'yt-tools-ni-btn', svg: SVG.hide, title: 'Not interested', priorities: ['not interested', 'hide'], isDelete: true },
            dontRecommend: { class: 'yt-tools-dr-btn', svg: SVG.block, title: "Don't recommend channel", priorities: ["don't recommend channel"], isDelete: true },
            removeWl: { class: 'yt-tools-rwl-btn', svg: SVG.trash, title: 'Remove from Watch Later', priorities: ['remove from watch later', 'remove from', 'remove'], isDelete: true },
            removePlaylist: { class: 'yt-tools-rpl-btn', svg: SVG.trash, title: 'Remove from Playlist', priorities: ['remove from playlist', 'remove from', 'remove'], isDelete: true },
            removeLiked: { class: 'yt-tools-rlk-btn', svg: SVG.trash, title: 'Remove from Liked', priorities: ['remove from liked videos', 'remove from', 'remove'], isDelete: true },
            removeHistory: { class: 'yt-tools-rhs-btn', svg: SVG.trash, title: 'Remove from History', priorities: ['remove from watch history', 'remove from', 'remove'], isDelete: true },
            moveTop: { class: 'yt-tools-mt-btn', svg: SVG.up, title: 'Move to top', priorities: ['move to top'], isDelete: false },
            moveBot: { class: 'yt-tools-mb-btn', svg: SVG.down, title: 'Move to bottom', priorities: ['move to bottom'], isDelete: false },
            hide: { class: 'yt-tools-hide-btn', svg: SVG.hide, title: 'Hide', priorities: ['hide', 'not interested'], isDelete: true },
            edit: { class: 'yt-tools-ed-btn', svg: SVG.edit, title: 'Edit', priorities: ['edit'], isDelete: false },
            delete: { class: 'yt-tools-del-btn', svg: SVG.trash, title: 'Delete', priorities: ['delete'], isDelete: true },
            promote: { class: 'yt-tools-pr-btn', svg: SVG.promote, title: 'Promote', priorities: ['promote'], isDelete: false }
        };

        // ─── Global Styles ────────────────────────────────────────────────────
        if (!document.getElementById('yt-tools-global-styles')) {
            const style = document.createElement('style');
            style.id = 'yt-tools-global-styles';
            style.textContent = `
                .yt-tools-actions-wrapper { display:flex; align-items:center; opacity:1; pointer-events:auto; }
                .yt-tools-custom-btn { background:transparent; border:none; cursor:pointer; color:var(--yt-spec-icon-inactive,#606060); padding:8px; margin-right:4px; display:flex; align-items:center; justify-content:center; border-radius:50%; transition:background .2s,color .2s; }
                .yt-tools-custom-btn:hover, .yt-tools-custom-btn:focus { background:var(--yt-spec-10-percent-layer,#e5e5e5); color:var(--yt-spec-icon-active_other,#0f0f0f); outline:none; }
                .yt-tools-toolbar { display:flex; align-items:center; flex-wrap:wrap; gap:12px; margin:0 0 16px; padding:12px 16px; border-radius:12px; width:100%; max-width:100%; box-sizing:border-box; z-index:1000; font-family:"Roboto","Arial",sans-serif; background:var(--yt-spec-badge-chip-background,rgba(0,0,0,.05)); border:1px solid var(--yt-spec-10-percent-layer,rgba(0,0,0,.1)); }
                html[dark] .yt-tools-toolbar { background:var(--yt-spec-badge-chip-background,rgba(255,255,255,.1)); border-color:var(--yt-spec-10-percent-layer,rgba(255,255,255,.1)); }
                .yt-tools-pill-btn { background:var(--yt-spec-text-primary,#0f0f0f); color:var(--yt-spec-base-background,#fff); border:none; border-radius:18px; padding:6px 16px; cursor:pointer; font-size:13px; font-weight:500; transition:opacity .2s; }
                html[dark] .yt-tools-pill-btn { background:var(--yt-spec-text-primary,#f1f1f1); color:var(--yt-spec-base-background,#0f0f0f); }
                .yt-tools-input { background:transparent; color:var(--yt-spec-text-primary,#0f0f0f); padding:4px 8px; border:1px solid var(--yt-spec-10-percent-layer,rgba(0,0,0,.1)); border-radius:8px; font-size:13px; outline:none; }
                html[dark] .yt-tools-input { color:var(--yt-spec-text-primary,#f1f1f1); border-color:var(--yt-spec-10-percent-layer,rgba(255,255,255,.2)); }
                .yt-tools-input option { background:var(--yt-spec-base-background,#fff); color:var(--yt-spec-text-primary,#0f0f0f); }
                html[dark] .yt-tools-input option { background:var(--yt-spec-menu-background,#282828); color:var(--yt-spec-text-primary,#f1f1f1); }
                .yt-tools-text-secondary { font-size:13px; color:var(--yt-spec-text-secondary,#606060); }
                html[dark] .yt-tools-text-secondary { color:var(--yt-spec-text-secondary,#aaaaaa); }
                .yt-tools-status-container { display:flex; align-items:center; margin-left:auto; font-size:12px; color:var(--yt-spec-text-secondary,#606060); font-weight:400; }
                html[dark] .yt-tools-status-container { color:var(--yt-spec-text-secondary,#aaaaaa); }
                .yt-tools-text-primary { font-weight:500; color:var(--yt-spec-text-primary,#0f0f0f); }
                html[dark] .yt-tools-text-primary { color:var(--yt-spec-text-primary,#f1f1f1); }
                .yt-tools-separator { margin:0 8px; color:var(--yt-spec-10-percent-layer,rgba(0,0,0,.1)); }
                html[dark] .yt-tools-separator { color:var(--yt-spec-10-percent-layer,rgba(255,255,255,.2)); }
                .yt-tools-duration-span { color:var(--yt-spec-text-secondary,#606060); font-size:1.2rem; font-weight:400; margin-left:6px; display:inline-block; }
                html[dark] .yt-tools-duration-span { color:var(--yt-spec-text-secondary,#aaaaaa); }
                .yt-tools-duration-span-panel { font-size:1.3rem; margin-left:8px; }
                html.yt-tools-hide-popups tp-yt-iron-dropdown, html.yt-tools-hide-popups ytd-menu-popup-renderer, html.yt-tools-hide-popups yt-confirm-dialog-renderer { opacity:0 !important; pointer-events:none !important; visibility:hidden !important; position:absolute !important; left:-9999px !important; top:-9999px !important; }
                ytd-miniplayer .yt-tools-toolbar, ytd-watch-flexy #secondary .yt-tools-toolbar { padding:8px; gap:8px; margin:0 0 8px; border-radius:8px; }
                ytd-miniplayer .yt-tools-toolbar > span, ytd-watch-flexy #secondary .yt-tools-toolbar > span { font-size:11px; }
                ytd-miniplayer .yt-tools-toolbar .yt-tools-pill-btn, ytd-watch-flexy #secondary .yt-tools-toolbar .yt-tools-pill-btn { padding:4px 10px; font-size:11px; }
                ytd-miniplayer .yt-tools-toolbar .yt-tools-input, ytd-watch-flexy #secondary .yt-tools-toolbar .yt-tools-input { padding:2px 4px; font-size:11px; }
                ytd-miniplayer .yt-tools-status-container, ytd-watch-flexy #secondary .yt-tools-status-container { width:100%; justify-content:flex-end; margin-top:4px; font-size:11px; }
            `;
            document.head.appendChild(style);
        }

        // ─── DOM Helpers ──────────────────────────────────────────────────────
        function createEl(tag, className = '', html = null) {
            const el = document.createElement(tag);
            if (className) el.className = className;
            if (html !== null) el.innerHTML = html;
            return el;
        }

        function createBtn(actionsWrapper, row, btnClass, svg, title, clickPriorities, isDelete = false) {
            let btn = actionsWrapper.querySelector(`.${btnClass}`);
            if (!btn) {
                btn = document.createElement('button');
                btn.className = `yt-tools-custom-btn ${btnClass}`;
                actionsWrapper.appendChild(btn);
            }

            if (btn.title !== title) {
                btn.title = title;
                btn.setAttribute('aria-label', title);
                btn.innerHTML = svg;
            }

            btn.onclick = (e) => {
                e.preventDefault(); e.stopPropagation(); btn.blur();

                if (isDelete) {
                    row.style.opacity = '0.3';
                    row.style.pointerEvents = 'none';
                    row.classList.add('yt-tools-deleted');
                }

                const menuBtn = row.querySelector(
                    'button[aria-label*="action" i]:not(.yt-tools-custom-btn), ' +
                    'button[aria-label*="more" i]:not(.yt-tools-custom-btn), ' +
                    'button[aria-haspopup="true"]:not(.yt-tools-custom-btn)'
                );

                const onDone = isDelete ? () => { row.style.display = 'none'; updateAll(); } : () => updateAll();

                if (menuBtn) {
                    executeHiddenMenuAction(menuBtn, clickPriorities, null, onDone, btn);
                } else if (isDelete) {
                    row.style.display = 'none';
                    updateAll();
                }
            };
        }

        const waitForElement = (selectorOrFn, timeout = 1200) =>
            new Promise((resolve, reject) => {
                const check = () => (typeof selectorOrFn === 'function' ? selectorOrFn() : document.querySelector(selectorOrFn));
                const el = check();
                if (el) return resolve(el);

                const obs = new MutationObserver(() => {
                    const found = check();
                    if (found) { obs.disconnect(); resolve(found); }
                });
                obs.observe(document.body, { childList: true, subtree: true });
                setTimeout(() => { obs.disconnect(); reject(new Error('Timeout')); }, timeout);
            });

        // ─── Hidden Menu Action ───────────────────────────────────────────────
        async function executeHiddenMenuAction(menuBtn, textPriorities, confirmSelector = null, callback = null, triggerButton = null) {
            let targetClass = '';
            let targetRowId = '';
            
            if (triggerButton) {
                const clsMatch = Array.from(triggerButton.classList).find(c => c !== 'yt-tools-custom-btn' && c.startsWith('yt-tools-'));
                if (clsMatch) targetClass = clsMatch;
                const parentRow = triggerButton.closest('[data-bound-id]');
                if (parentRow) targetRowId = parentRow.getAttribute('data-bound-id');
                
                triggerButton.focus();
            } else {
                menuBtn.focus(); 
            }

            document.documentElement.classList.add('yt-tools-hide-popups');

            const origExpanded  = menuBtn.getAttribute('aria-expanded');
            const origHasPopup  = menuBtn.getAttribute('aria-haspopup');
            menuBtn.removeAttribute('aria-expanded');
            menuBtn.removeAttribute('aria-haspopup');

            const nativeSetAttr = menuBtn.setAttribute.bind(menuBtn);
            menuBtn.setAttribute = (name, value) => {
                if (name === 'aria-expanded' || name === 'aria-haspopup') return;
                nativeSetAttr(name, value);
            };

            const nativeFocus = HTMLElement.prototype.focus;
            HTMLElement.prototype.focus = () => {};

            mainObserver.disconnect();
            menuBtn.click();

            try {
                await new Promise(r => setTimeout(r, 50));

                const targetOpt = await waitForElement(() => {
                    for (const menu of document.querySelectorAll('tp-yt-iron-dropdown, ytd-menu-popup-renderer, [role="menu"]')) {
                        if (menu.getAttribute('aria-hidden') === 'true') continue;
                        const items = Array.from(menu.querySelectorAll(
                            'tp-yt-paper-item, ytd-menu-service-item-renderer, ytd-menu-navigation-item-renderer, yt-list-item-view-model'
                        ));
                        for (const pref of textPriorities) {
                            const found = items.find(item => item.textContent.toLowerCase().includes(pref.toLowerCase()));
                            if (found) return found;
                        }
                    }
                    return null;
                }, 1000);

                if (targetOpt) {
                    const clickTarget = targetOpt.querySelector('button, a') || targetOpt.closest('a') || targetOpt;
                    const isInteractive = targetOpt.textContent.toLowerCase().includes('save to playlist');

                    if (isInteractive) {
                        HTMLElement.prototype.focus = nativeFocus;
                    }

                    clickTarget.click();

                    if (isInteractive) {
                        document.documentElement.classList.remove('yt-tools-hide-popups');

                        const openMenu = clickTarget.closest('tp-yt-iron-dropdown') || document.querySelector('tp-yt-iron-dropdown:not([aria-hidden="true"])');
                        if (openMenu) {
                            if (typeof openMenu.close === 'function') openMenu.close();
                            else {
                                openMenu.style.display = 'none';
                                openMenu.setAttribute('aria-hidden', 'true');
                            }
                        }

                        setTimeout(() => {
                            const popupContainer = document.querySelector('ytd-popup-container');
                            if (!popupContainer) return;

                            const activeDialog = popupContainer.querySelector('tp-yt-paper-dialog:not([aria-hidden="true"]), ytd-add-to-playlist-create-dialog-renderer');
                            if (!activeDialog) return; 

                            let isReturning = false; 

                            const executeReturn = () => {
                                if (isReturning) return;
                                isReturning = true;

                                observer.disconnect();
                                activeDialog.removeEventListener('keydown', interactionHandler);
                                activeDialog.removeEventListener('click', interactionHandler);

                                activeDialog.restoreFocusOnClose = false;

                                if (typeof activeDialog.close === 'function') activeDialog.close();
                                else activeDialog.setAttribute('aria-hidden', 'true');

                                setTimeout(() => {
                                    let finalTarget = triggerButton;
                                    
                                    if (triggerButton && !document.body.contains(triggerButton) && targetRowId && targetClass) {
                                        const freshRow = document.querySelector(`[data-bound-id="${targetRowId}"]`);
                                        if (freshRow) {
                                            const freshBtn = freshRow.querySelector(`.${targetClass}`);
                                            if (freshBtn) finalTarget = freshBtn;
                                        }
                                    }

                                    if (finalTarget) finalTarget.focus();
                                    else if (menuBtn && document.body.contains(menuBtn)) menuBtn.focus();

                                    if (callback) callback();

                                    const focusGuard = (e) => {
                                        const newFocus = e.target;
                                        if (!newFocus) return;
                                        
                                        const isToast = newFocus.closest('ytd-toast-renderer, tp-yt-paper-toast, #toast, #toasts, ytd-popup-container');
                                        if (newFocus === document.body || isToast) {
                                            if (finalTarget) finalTarget.focus();
                                        }
                                    };
                                    
                                    document.addEventListener('focusin', focusGuard);
                                    
                                    setTimeout(() => {
                                        document.removeEventListener('focusin', focusGuard);
                                    }, 3000);

                                }, 150); 
                            };

                            const interactionHandler = (e) => {
                                if (e.key === 'Escape') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    executeReturn();
                                    return;
                                }
                        
                                const isActivateEvent = e.type === 'click' || (e.type === 'keydown' && (e.key === 'Enter' || e.key === ' '));
                                if (isActivateEvent) {
                                    const isPlaylistItem = e.target.closest('ytd-playlist-add-to-option-renderer, tp-yt-paper-checkbox');
                                    if (isPlaylistItem) {
                                        setTimeout(executeReturn, 300);
                                    }
                                }
                            };

                            activeDialog.addEventListener('keydown', interactionHandler);
                            activeDialog.addEventListener('click', interactionHandler);

                            const observer = new MutationObserver(() => {
                                if (!document.body.contains(activeDialog) || activeDialog.getAttribute('aria-hidden') === 'true' || activeDialog.style.display === 'none') {
                                    executeReturn(); 
                                }
                            });

                            observer.observe(popupContainer, { 
                                childList: true, 
                                subtree: true, 
                                attributes: true, 
                                attributeFilter: ['aria-hidden', 'style'] 
                            });
                    
                        }, 500); 

                    } else if (confirmSelector) {
                        const confirmBtn = await waitForElement(confirmSelector, 1000);
                        if (confirmBtn) confirmBtn.click();
                    } else {
                        setTimeout(() => {
                            if (document.activeElement) document.activeElement.blur();
                            document.body.click();
                        }, 50);
                    }

                    if (callback && !isInteractive) setTimeout(callback, 200);
                }
            } catch {
                document.body.click();
            } finally {
                setTimeout(() => {
                    document.documentElement.classList.remove('yt-tools-hide-popups');
                    HTMLElement.prototype.focus = nativeFocus; 

                    if (document.body.contains(menuBtn)) {
                        menuBtn.setAttribute = nativeSetAttr;
                        if (origExpanded) nativeSetAttr('aria-expanded', 'false');
                        if (origHasPopup) nativeSetAttr('aria-haspopup', origHasPopup);
                    }

                    startObserver();
                }, 300);
            }
        }

        // ─── Time & Data Parsers ──────────────────────────────────────────────
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

            const blockRegex = /(?:(?:^|\b)(\d+)\s*(?:hours?|hr))?[,\s]*(?:(?:^|\b)(\d+)\s*(?:minutes?|mins?))?[,\s]*(?:(?:^|\b)(\d+)\s*(?:seconds?|secs?))?/g;
            let best = 0;
            let m;
            while ((m = blockRegex.exec(text)) !== null) {
                if (m.index === blockRegex.lastIndex) blockRegex.lastIndex++;
                const secs = (parseInt(m[1]) || 0) * 3600 + (parseInt(m[2]) || 0) * 60 + (parseInt(m[3]) || 0);
                if (secs > 0) best = secs;
            }
            return best;
        }

        function formatTime(seconds) {
            if (isNaN(seconds) || seconds < 0) return '0:00';
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
            const s = Math.floor(seconds % 60).toString().padStart(2, '0');
            return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
        }

        function getVideoID(vid) {
            for (const link of vid.querySelectorAll('a[href*="/watch?"]')) {
                const m = link.href.match(/[?&]v=([^&]+)/);
                if (m) return m[1];
            }
            if (vid.hasAttribute('video-id')) return vid.getAttribute('video-id');
            for (const link of vid.querySelectorAll('a[href*="/playlist?list="]')) {
                const m = link.href.match(/[?&]list=([^&]+)/);
                if (m) return 'pl-' + m[1];
            }
            const img = vid.querySelector('img[src*="ytimg.com/vi/"]');
            if (img) {
                const m = img.src.match(/ytimg\.com\/vi\/([^/]+)/);
                if (m) return m[1];
            }
            const titleEl = vid.querySelector('#video-title, .yt-lockup-metadata-view-model__title, .ytLockupMetadataViewModelTitle');
            if (titleEl?.textContent) return 'title-' + titleEl.textContent.trim().replace(/\s+/g, '').substring(0, 40);
            return 'unknown-' + Math.random().toString(36).substr(2, 9);
        }

        function parseViews(text) {
            const clean = text.replace(/[\s,]+/g, '').replace(/(views?|watching|waiting)/g, '');
            if (clean === 'no') return 0;
            const m = clean.match(/^([\d.]+)([kmbt]?)$/);
            if (!m) return 0;
            const multipliers = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 };
            return parseFloat(m[1]) * (multipliers[m[2]] || 1);
        }

        function parseAgoToMinutes(text) {
            const m = text.match(/([\d.]+)\s*(year|month|week|day|hour|min|sec|mo|y|w|d|h|m|s)[a-z]*\s*ago/);
            if (!m) return 0;
            const v = parseFloat(m[1]), u = m[2];
            if (u.startsWith('y')) return v * 525600;
            if (u.startsWith('mo') || u === 'mo') return v * 43200;
            if (u.startsWith('w')) return v * 10080;
            if (u.startsWith('d')) return v * 1440;
            if (u.startsWith('h')) return v * 60;
            if (u.startsWith('m') && !u.startsWith('mo')) return v;
            if (u.startsWith('s')) return v / 60;
            return 0;
        }

        function parseInfoParts(parts) {
            let dateVal = 0, viewsVal = 0, channel = '', isMovie = false;
            for (let i = 0; i < parts.length; i++) {
                const p = parts[i];
                if (!dateVal) {
                    if (p.includes('ago')) dateVal = parseAgoToMinutes(p);
                    else if (/^(19|20)\d{2}$/.test(p)) {
                        const year = parseInt(p, 10);
                        dateVal = Math.max(0, new Date().getFullYear() - year) * 525600;
                        isMovie = true;
                        if (i > 0) channel = parts[i - 1];
                    }
                }
                if (!viewsVal && (p.includes('view') || p.includes('watching') || p.includes('waiting') || /^[\d.,]+[kmbt]?$/.test(p))) {
                    viewsVal = parseViews(p);
                }
            }
            return { dateVal, viewsVal, channel, isMovie };
        }

        function getVideoData(vid, index) {
            try {
                const id = getVideoID(vid);
                const badgeTexts = Array.from(vid.querySelectorAll('.yt-badge-shape__text, .ytBadgeShapeText, span#text.ytd-thumbnail-overlay-time-status-renderer, .badge-shape-wiz__text'))
                    .map(b => b.textContent?.trim().toLowerCase() ?? '');
                const isLiveFresh = badgeTexts.some(t => ['live', 'upcoming', 'premiere'].includes(t));

                let duration = 0;
                const badge = vid.querySelector('.yt-badge-shape__text, .ytBadgeShapeText, span#text.ytd-thumbnail-overlay-time-status-renderer, .badge-shape-wiz__text');
                if (badge?.textContent?.includes(':')) duration = parseDurationFromText(badge.textContent);

                const titleEl = vid.querySelector('#video-title, .yt-lockup-metadata-view-model__title, .ytLockupMetadataViewModelTitle');
                let title = titleEl?.textContent?.trim() ?? '';
                const ariaText = titleEl ? (titleEl.getAttribute('data-original-aria') || titleEl.getAttribute('aria-label') || titleEl.title || '') : '';
                if (!duration && ariaText) duration = parseDurationFromText(ariaText);

                let progress = parseFloat(vid.getAttribute('percent-watched') || '0') || 0;
                if (!progress) {
                    for (const bar of vid.querySelectorAll('ytd-thumbnail-overlay-resume-playback-renderer #progress, ytd-thumbnail-overlay-resume-playback-renderer, .ytp-play-progress, .ytThumbnailOverlayProgressBarHostWatchedProgressBarSegment, #progress')) {
                        const w = bar.style.width || bar.style.getPropertyValue('--yt-progress-bar-width');
                        if (w?.includes('%')) { const val = parseFloat(w); if (val > 0) { progress = val; break; } }
                    }
                }

                if (!state.memoryVault[id]) state.memoryVault[id] = {};
                if (state.memoryVault[id].originalIndex === undefined) {
                    state.snapshotCounter++;
                    state.memoryVault[id].originalIndex = state.snapshotCounter;
                }
                vid.setAttribute('data-snapshot', state.memoryVault[id].originalIndex);
                let originalIndex = state.memoryVault[id].originalIndex;

                let channel = vid.querySelector('.ytd-channel-name, #channel-name, .yt-core-attributed-string__link')?.textContent?.trim() ?? '';
                let viewsVal = 0, dateVal = 0, isMovie = false;

                const exactViewMatch = ariaText.toLowerCase().match(/([\d,]+)\s*(views?|watching|waiting)/);
                if (exactViewMatch) viewsVal = parseInt(exactViewMatch[1].replace(/,/g, ''), 10);

                const metadataLine = vid.querySelector('#video-info, #metadata-line, .ytContentMetadataViewModelHost, .grid-movie-renderer-metadata, .movie-metadata-list');
                if (metadataLine) {
                    const spanItems = metadataLine.querySelectorAll('.inline-metadata-item, .ytContentMetadataViewModelMetadataText');
                    const parts = spanItems.length > 0 ? Array.from(spanItems).map(el => el.textContent.toLowerCase().trim()) : metadataLine.textContent.toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, ' ').split(/[\n•·|]/).map(p => p.trim()).filter(Boolean);
                    const parsed = parseInfoParts(parts);
                    dateVal = parsed.dateVal; viewsVal = viewsVal || parsed.viewsVal; isMovie = parsed.isMovie;
                    if (parsed.channel) channel = parsed.channel;
                    if (!channel && parts.length > 0 && !parts[0].includes('view') && !parts[0].includes('ago')) channel = parts[0];
                }

                if (!viewsVal || !dateVal) {
                    const parts = (vid.innerText || vid.textContent || '').toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, ' ').split(/[\n•·|]/).map(p => p.trim()).filter(Boolean);
                    const parsed = parseInfoParts(parts);
                    if (!dateVal) dateVal = parsed.dateVal; if (!viewsVal) viewsVal = parsed.viewsVal;
                    if (!isMovie) isMovie = parsed.isMovie; if (parsed.channel && !channel) channel = parsed.channel;
                }

                if (id) {
                    const v = state.memoryVault[id];
                    if (duration) v.duration = duration; if (progress) v.progress = progress;
                    if (viewsVal) v.views = viewsVal; if (dateVal) v.date = dateVal;
                    if (title) v.title = title; if (channel) v.channel = channel;
                    if (isLiveFresh) v.isLive = true; if (isMovie) v.isMovie = true;

                    duration = duration || v.duration || 0; progress = progress || v.progress || 0;
                    viewsVal = viewsVal || v.views || 0; dateVal = dateVal || v.date || 0;
                    title = title || v.title || ''; channel = channel || v.channel || '';
                    const isLive = v.isLive || isLiveFresh; isMovie = v.isMovie || isMovie;
                    return { duration, progress, title, channel, dateVal, viewsVal, currentIndex: index || 0, originalIndex, isLive, isMovie, element: vid };
                }
                return { duration, progress, title, channel, dateVal, viewsVal, currentIndex: index || 0, originalIndex, isLive: isLiveFresh, isMovie, element: vid };
            } catch {
                return { duration: 0, progress: 0, title: '', channel: '', dateVal: 0, viewsVal: 0, currentIndex: index || 0, originalIndex: index || 0, isLive: false, isMovie: false, element: vid };
            }
        }

        // ─── Container & Row Selection ────────────────────────────────────────
        function isVisible(el) {
            if (!el) return false;
            if (el.closest('[hidden]') || el.closest('[aria-hidden="true"]')) return false;
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
            const rect = el.getBoundingClientRect();
            return (rect.width > 0 && rect.height > 0) || style.display === 'contents';
        }

        function getActiveContainer() {
            const path = window.location.pathname;
            if (path.startsWith('/results')) {
                const el = document.querySelector('ytd-search ytd-section-list-renderer > #contents');
                if (isVisible(el)) return { type: 'search', itemsEl: el };
            }
            const expandBtn = document.querySelector('.ytdMiniplayerInfoBarExpand button');
            if (expandBtn?.getAttribute('aria-expanded') === 'true') {
                const el = document.querySelector('ytd-miniplayer ytd-playlist-panel-renderer #items.playlist-items, ytd-miniplayer ytd-playlist-panel-renderer #items');
                if (isVisible(el)) return { type: 'panel', itemsEl: el };
            }
            if (path === '/watch') {
                const playlistRenderer = document.querySelector('ytd-playlist-panel-renderer#playlist, ytd-watch-flexy #secondary ytd-playlist-panel-renderer');
                if (playlistRenderer && !playlistRenderer.hasAttribute('collapsed')) {
                    const el = playlistRenderer.querySelector('#items.playlist-items, #items');
                    if (isVisible(el)) return { type: 'panel', itemsEl: el };
                }
                const firstVideo = Array.from(document.querySelectorAll(ROW_SELECTOR)).find(v => isVisible(v) && !v.closest('ytd-miniplayer'));
                if (firstVideo) {
                    const queue = firstVideo.closest('#contents, #items');
                    if (isVisible(queue)) return { type: 'panel', itemsEl: queue };
                }
            }
            if (path === '/playlist') {
                const empty = document.querySelector('ytd-browse[page-subtype="playlist"] ytd-message-renderer, ytd-playlist-video-list-renderer ytd-message-renderer');
                if (isVisible(empty)) return { type: 'playlist', itemsEl: empty };
                const el = document.querySelector('ytd-browse[page-subtype="playlist"] ytd-item-section-renderer > #contents, ytd-playlist-video-list-renderer #contents');
                if (isVisible(el)) return { type: 'playlist', itemsEl: el };
            }
            if (path === '/feed/history') {
                const el = document.querySelector('ytd-browse[page-subtype="history"] ytd-section-list-renderer #contents');
                const empty = document.querySelector('ytd-browse[page-subtype="history"] ytd-message-renderer');
                if (isVisible(el)) return { type: 'history', itemsEl: el };
                if (isVisible(empty)) return { type: 'history', itemsEl: empty };
            }
            if (path === '/feed/subscriptions') {
                const el = document.querySelector('ytd-browse[page-subtype="subscriptions"] ytd-section-list-renderer #contents, ytd-browse[page-subtype="subscriptions"] ytd-rich-grid-renderer #contents');
                if (isVisible(el)) return { type: 'grid', itemsEl: el };
            }
            if (path === '/feed/you' || path === '/feed/library') {
                const el = document.querySelector('ytd-browse[page-subtype="personal_profile"] ytd-section-list-renderer > #contents, ytd-browse ytd-section-list-renderer > #contents');
                if (isVisible(el)) return { type: 'grid', itemsEl: el };
            }
            const isChannel = ['/@', '/c/', '/channel/', '/user/'].some(p => path.startsWith(p.trim()));
            if (isChannel || path.startsWith('/@')) {
                const visibleContainer = Array.from(document.querySelectorAll('ytd-two-column-browse-results-renderer ytd-rich-grid-renderer, ytd-two-column-browse-results-renderer ytd-section-list-renderer, ytd-two-column-browse-results-renderer ytd-item-section-renderer')).find(c => {
                    const r = c.getBoundingClientRect(); return r.width > 0 && r.height > 0 && window.getComputedStyle(c).display !== 'none' && !c.closest('[hidden]');
                });
                if (visibleContainer) {
                    const el = visibleContainer.querySelector('#contents');
                    if (el) return { type: 'grid', itemsEl: el };
                }
            }
            for (const el of document.querySelectorAll('ytd-playlist-panel-renderer #items.playlist-items, ytd-playlist-panel-renderer #items')) {
                if (isVisible(el) && !el.closest('ytd-miniplayer')) return { type: 'panel', itemsEl: el };
            }
            const visibleGrid = Array.from(document.querySelectorAll('ytd-rich-grid-renderer')).find(g => isVisible(g) && isVisible(g.querySelector('#contents')) && !g.closest('[hidden]'));
            if (visibleGrid) {
                const el = visibleGrid.querySelector('#contents');
                if (el) return { type: 'grid', itemsEl: el };
            }
            return null;
        }

        function getValidVideoRows(container) {
            const rawNodes = Array.from(container.querySelectorAll(ROW_SELECTOR));
            const topLevel = rawNodes.filter(node => {
                let p = node.parentElement;
                while (p && p !== container) { if (rawNodes.includes(p)) return false; p = p.parentElement; }
                return true;
            });
            const seenNodes = new Set(), seenIds = new Set();
            const path = window.location.pathname, isDedup = path === '/' || path === '/feed/subscriptions';
            const validRows = [];

            for (const row of topLevel) {
                if (row.classList.contains('yt-tools-deleted')) continue;
                const style = window.getComputedStyle(row);
                if (style.display === 'none' || style.visibility === 'hidden') continue;
                if (style.display !== 'contents') { const rect = row.getBoundingClientRect(); if (!rect.width || !rect.height) continue; }
                if (row.hasAttribute('is-skeleton') || row.querySelector('[skeleton]')) continue;
                if (seenNodes.has(row)) continue;
                seenNodes.add(row);

                const tag = row.tagName.toLowerCase();
                if (row.querySelector('ytd-mini-game-card-view-model, a[href*="/playables/"]')) continue;
                const isShort = row.querySelector('a.reel-item-endpoint, ytm-shorts-lockup-view-model, [overlay-style="SHORTS"], a[href*="/shorts/"]') !== null || tag.includes('shorts');
                if (isShort || row.querySelector('ytd-post-renderer, ytd-shared-post-renderer')) continue;

                if (!row.dataset.ytToolsNews) {
                    const section = row.closest('ytd-rich-section-renderer, ytd-shelf-renderer');
                    const shelfTitle = section?.querySelector('#title, .title, #title-container, .ytShelfHeaderLayoutTitle')?.textContent.toLowerCase() ?? '';
                    row.dataset.ytToolsNews = shelfTitle.includes('news') ? 'true' : 'false';
                }

                const parentSection = row.closest('ytd-rich-section-renderer, ytd-shelf-renderer');
                if (parentSection) {
                    parentSection.dataset.ytSortGroup ??= 'shelf-' + Math.random().toString(36).substr(2, 9);
                    row.dataset.ytSortGroup = parentSection.dataset.ytSortGroup;
                } else row.dataset.ytSortGroup = 'global';

                const watchLink = row.querySelector('a[href*="/watch?v="], a[href*="/live/"], a[href*="/playlist?"]');
                const href = watchLink?.getAttribute('href') ?? '';
                const isMix = !!row.querySelector('ytd-radio-renderer, [href*="start_radio="]') || href.includes('list=RD') || href.includes('list=AL') || href.includes('list=ML');
                if (isMix) continue;

                const isVideoRenderer = ['ytd-playlist-video-renderer', 'ytd-playlist-panel-video-renderer'].includes(tag);
                if (!isVideoRenderer) {
                    const isPlaylist = ['ytd-playlist-renderer', 'ytd-grid-playlist-renderer'].includes(tag) || href.includes('/playlist?') || (row.querySelector('yt-collection-thumbnail-view-model')?.getBoundingClientRect().width > 0) || (row.querySelector('ytd-playlist-thumbnail')?.getBoundingClientRect().width > 0);
                    if (isPlaylist) continue;
                }

                if (!watchLink) continue;
                const idMatch = watchLink.href.match(/(?:[?&]v=|\/live\/)([^&?/]+)/);
                if (!idMatch) continue;

                if (isDedup) {
                    if (seenIds.has(idMatch[1])) { row.style.display = 'none'; row.classList.add('yt-tools-deleted'); continue; }
                    seenIds.add(idMatch[1]);
                }
                validRows.push(row);
            }
            return validRows;
        }

        function cleanAndGetRows() {
            const active = getActiveContainer();
            if (!active?.itemsEl) return { container: null, rows: [] };
            return { container: active.itemsEl, rows: getValidVideoRows(active.itemsEl) };
        }

        // ─── Zone Logic ───────────────────────────────────────────────────────
        function determineZone(path, href, row, sectionTitle) {
            if (path.includes('premium_benefits')) return 'premium';
            if (row.tagName.toLowerCase() === 'ytd-miniplayer') return 'miniplayer';

            // 1. Detect "You" page shelves
            const isYouPage = path.includes('/feed/you') || path.includes('/feed/library');
            if (isYouPage) {
                if (sectionTitle.includes('history')) return 'youHistoryShelf';
                if (sectionTitle.includes('watch later')) return 'youWatchLaterShelf';
                if (sectionTitle.includes('liked')) return 'youLikedVideosShelf';
                if (sectionTitle.includes('playlist')) return 'youPlaylistsShelf';
                return 'home'; // Fallback for unknown shelves on the You page
            }

            // 2. Detect Main Library Pages
            if (path === '/feed/history') return 'watchHistory';
            if (href.includes('list=WL')) return 'watchLater';
            if (href.includes('list=LL')) return 'likedVideos';
            if (path === '/playlist') return 'playlist';

            // 3. Detect Core Navigation
            if (path.startsWith('/results')) return 'search';
            if (path === '/feed/subscriptions') return 'subscriptions';
            if (path === '/') return 'home';

            // 4. Detect Channel Profiles
            const isChannel = ['/@', '/c/', '/channel/'].some(p => path.startsWith(p));
            if (isChannel) {
                const hasAvatarEdit = !!document.querySelector('ytd-channel-avatar-editor, #channel-header-container [aria-label*="edit profile" i], #channel-header-container [aria-label*="picture" i]');
                if (path.endsWith('/videos')) return hasAvatarEdit ? 'yourProfileVideos' : 'otherProfileVideos';
                if (path.endsWith('/playlists')) return hasAvatarEdit ? 'yourProfilePlaylists' : 'otherProfilePlaylists';
                if (path.endsWith('/streams')) return 'otherProfileLive';
                return hasAvatarEdit ? 'yourProfileHome' : 'otherProfileHome';
            }

            if (path === '/watch') return 'watch';

            return 'home'; // Fallback
        }

        // ─── DOM Injection ────────────────────────────────────────────────────
        const ROW_HOVER_CSS = `
            .yt-tools-actions-wrapper { opacity:0; pointer-events:none; transition:opacity .15s ease-in-out; flex-shrink:0 !important; }
            .yt-tools-solid-bg { background-color:var(--yt-spec-base-background,#ffffff) !important; box-shadow:-12px 0 10px var(--yt-spec-base-background,#ffffff) !important; padding-left:6px !important; z-index:9999 !important; border-radius:4px; }
            html[dark] .yt-tools-solid-bg { background-color:var(--yt-spec-base-background,#0f0f0f) !important; box-shadow:-12px 0 10px var(--yt-spec-base-background,#0f0f0f) !important; }
            ytd-playlist-panel-video-renderer:hover .yt-tools-actions-wrapper, ytd-playlist-panel-video-renderer:focus-within .yt-tools-actions-wrapper,
            ytd-playlist-video-renderer:hover .yt-tools-actions-wrapper, ytd-playlist-video-renderer:focus-within .yt-tools-actions-wrapper,
            ytd-rich-item-renderer:hover .yt-tools-actions-wrapper, ytd-rich-item-renderer:focus-within .yt-tools-actions-wrapper,
            ytd-video-renderer:hover .yt-tools-actions-wrapper, ytd-video-renderer:focus-within .yt-tools-actions-wrapper,
            ytd-playlist-renderer:hover .yt-tools-actions-wrapper, ytd-playlist-renderer:focus-within .yt-tools-actions-wrapper,
            ytd-grid-video-renderer:hover .yt-tools-actions-wrapper, ytd-grid-video-renderer:focus-within .yt-tools-actions-wrapper,
            ytd-grid-playlist-renderer:hover .yt-tools-actions-wrapper, ytd-grid-playlist-renderer:focus-within .yt-tools-actions-wrapper,
            ytd-compact-video-renderer:hover .yt-tools-actions-wrapper, ytd-compact-video-renderer:focus-within .yt-tools-actions-wrapper,
            yt-lockup-view-model:hover .yt-tools-actions-wrapper, yt-lockup-view-model:focus-within .yt-tools-actions-wrapper,
            ytd-movie-renderer:hover .yt-tools-actions-wrapper, ytd-movie-renderer:focus-within .yt-tools-actions-wrapper,
            ytd-grid-movie-renderer:hover .yt-tools-actions-wrapper, ytd-grid-movie-renderer:focus-within .yt-tools-actions-wrapper,
            .yt-tools-actions-wrapper:focus-within { opacity:1 !important; pointer-events:auto !important; }
        `;

        const WRAPPER_CSS_FLOATING = 'display:flex !important; flex-direction:column; align-items:center; position:absolute; right:10px; top:36px; z-index:99; background:var(--yt-spec-raised-background); border:1px solid var(--yt-spec-10-percent-layer); border-radius:8px; padding:4px; gap:4px; box-shadow:0px 4px 16px rgba(0,0,0,0.15); color:var(--yt-spec-icon-inactive);';
        const WRAPPER_CSS_INLINE   = 'display:flex !important; flex-direction:column; align-items:center; z-index:99; flex-shrink:0; margin-left:12px; margin-top:36px; gap:4px;';

        function injectRowModifications() {
            if (!document.getElementById('yt-tools-hover-css')) {
                const style = document.createElement('style'); style.id = 'yt-tools-hover-css'; style.textContent = ROW_HOVER_CSS;
                document.head.appendChild(style);
            }

            const path = window.location.pathname, href = window.location.href;
            const rawNodes = Array.from(document.querySelectorAll(ROW_SELECTOR));
            const allRows = rawNodes.filter(row => !(row.tagName.toLowerCase() === 'yt-lockup-view-model' && row.closest('ytd-rich-item-renderer, ytd-video-renderer, ytd-playlist-renderer')));

            for (const [i, row] of allRows.entries()) {
                if (row.classList.contains('yt-tools-deleted')) continue;

                const id = getVideoID(row);
                const boundId = row.getAttribute('data-bound-id');

                if (boundId !== String(id)) {
                    row.setAttribute('data-bound-id', String(id));
                    row.removeAttribute('data-snapshot');
                    const titleAnchor = row.querySelector('#video-title, .yt-lockup-metadata-view-model__title, .ytLockupMetadataViewModelTitle');
                    if (titleAnchor) {
                        titleAnchor.removeAttribute('data-original-aria');
                        if (titleAnchor.getAttribute('aria-label')?.includes('\u200B')) titleAnchor.removeAttribute('aria-label');
                    }
                }

                if (id) {
                    const v = state.memoryVault[id] ??= {};
                    if (v.snapshotIndex === undefined) { state.snapshotCounter++; v.snapshotIndex = state.snapshotCounter; }
                    row.setAttribute('data-snapshot', v.snapshotIndex);
                }

                const tag = row.tagName.toLowerCase();
                if (row.querySelector('ytd-mini-game-card-view-model, a[href*="/playables/"]')) continue;
                if (row.querySelector('a.reel-item-endpoint, ytm-shorts-lockup-view-model, [overlay-style="SHORTS"], a[href*="/shorts/"]') || tag.includes('shorts')) continue;
                if (row.querySelector('ytd-post-renderer, ytd-shared-post-renderer')) continue;

                const data = getVideoData(row, i);
                const titleAnchor = row.querySelector('#video-title, .yt-lockup-metadata-view-model__title, .ytLockupMetadataViewModelTitle');
                const watchLink = row.querySelector('a[href*="/watch?v="], a[href*="/live/"], a[href*="/playlist?"]');
                const rowHref = watchLink?.getAttribute('href') ?? '';

                const parentSection = row.closest('ytd-rich-section-renderer, ytd-shelf-renderer');
                const sectionTitle = parentSection?.querySelector('#title, #title-text, .title, .ytShelfHeaderLayoutTitle')?.textContent.toLowerCase() ?? '';
                const isNews = row.dataset.ytToolsNews === 'true' || sectionTitle.includes('news');
                if (sectionTitle.includes('news')) row.dataset.ytToolsNews = 'true';

                let isPlaylist = false;
                if (!isNews && !['ytd-playlist-video-renderer', 'ytd-playlist-panel-video-renderer'].includes(tag)) {
                    isPlaylist = ['ytd-playlist-renderer', 'ytd-grid-playlist-renderer'].includes(tag) || rowHref.includes('/playlist?') || (row.querySelector('yt-collection-thumbnail-view-model')?.getBoundingClientRect().width > 0) || (row.querySelector('ytd-playlist-thumbnail')?.getBoundingClientRect().width > 0);
                }
                const isMix = !!row.querySelector('ytd-radio-renderer, [href*="start_radio="]') || rowHref.includes('list=RD') || rowHref.includes('list=AL') || rowHref.includes('list=ML');

                if (isPlaylist && !row.querySelector('button[aria-label*="action" i]:not(.yt-tools-custom-btn), button[aria-label*="more" i]:not(.yt-tools-custom-btn), ytd-menu-renderer button:not(.yt-tools-custom-btn), #menu button:not(.yt-tools-custom-btn), .ytLockupMetadataViewModelMenuButton button:not(.yt-tools-custom-btn)') && !isMix) continue;

                // ARIA Update 
                if (titleAnchor) {
                    const linkParent = titleAnchor.closest('a'), headingParent = titleAnchor.closest('h3, h4');
                    if (!titleAnchor.getAttribute('data-original-aria')) {
                        const candidates = [linkParent?.getAttribute('aria-label'), headingParent?.getAttribute('aria-label'), titleAnchor.getAttribute('aria-label'), titleAnchor.title, titleAnchor.textContent].map(s => s?.trim().replace(/\s+/g, ' ') ?? '').filter(Boolean);
                        titleAnchor.setAttribute('data-original-aria', candidates.reduce((a, b) => a.length > b.length ? a : b, ''));
                    }
                    let baseText = titleAnchor.getAttribute('data-original-aria').trim();
                    if (baseText.includes('\u200B')) baseText = baseText.split('\u200B')[1].trim();

                    let statusPrefix = '';
                    if (isPlaylist) statusPrefix = 'Playlist: ';
                    else if (isNews) statusPrefix = 'News: ';
                    else {
                        const badges = Array.from(row.querySelectorAll('.yt-badge-shape__text, .ytBadgeShapeText, span#text.ytd-thumbnail-overlay-time-status-renderer, .badge-shape-wiz__text')).map(b => b.textContent.trim().toLowerCase());
                        if (badges.includes('live')) statusPrefix = 'Live: '; else if (badges.includes('upcoming') || badges.includes('premiere')) statusPrefix = 'Upcoming: ';
                    }

                    const newAria = (data.progress > 0 && !isMix && !isPlaylist && !isNews) ? `${statusPrefix}${data.progress >= 100 ? 'Watched:' : Math.round(data.progress) + '% watched:'} \u200B${baseText}` : `${statusPrefix}\u200B${baseText}`;
                    if (linkParent && linkParent !== titleAnchor) { linkParent.removeAttribute('aria-label'); linkParent.removeAttribute('title'); }
                    if (headingParent) { headingParent.removeAttribute('aria-label'); headingParent.removeAttribute('title'); }
                    titleAnchor.setAttribute('aria-label', newAria); titleAnchor.removeAttribute('title');
                }

                const nativeMenuBtn = row.querySelector('button[aria-label*="action" i]:not(.yt-tools-custom-btn), button[aria-label*="more" i]:not(.yt-tools-custom-btn), ytd-menu-renderer button:not(.yt-tools-custom-btn), #menu button:not(.yt-tools-custom-btn), .ytLockupMetadataViewModelMenuButton button:not(.yt-tools-custom-btn)');
                if (!nativeMenuBtn) continue;

                // UI Wrappers 
                let actionsWrapper = row.querySelector('.yt-tools-actions-wrapper');
                const menuContainer = row.querySelector('#menu, .ytLockupMetadataViewModelMenuButton, ytd-menu-renderer');
                if (!actionsWrapper) { actionsWrapper = document.createElement('div'); actionsWrapper.className = 'yt-tools-actions-wrapper'; }

                actionsWrapper.style.cssText = ['ytd-video-renderer', 'ytd-playlist-video-renderer', 'ytd-movie-renderer'].includes(tag) ? WRAPPER_CSS_INLINE : WRAPPER_CSS_FLOATING;

                if (menuContainer) {
                    if (tag === 'ytd-video-renderer' || tag === 'ytd-movie-renderer') menuContainer.style.cssText = 'display:flex; flex-direction:column; align-items:center;';
                    else menuContainer.style.position = 'relative';
                    if (menuContainer.firstChild !== actionsWrapper) menuContainer.prepend(actionsWrapper);
                } else {
                    const fallback = row.querySelector('#meta, #details, #metadata, .yt-lockup-metadata') || row;
                    fallback.style.position = 'relative';
                    if (fallback.firstChild !== actionsWrapper) fallback.prepend(actionsWrapper);
                }

                // Dynamic Button Injection 
                Array.from(actionsWrapper.children).forEach(child => child.remove());

                const zone = determineZone(path, href, row, sectionTitle);
                
                if (zone === 'premium') {
                    const cfg = BUTTON_FACTORY.notInterested;
                    createBtn(actionsWrapper, row, cfg.class, cfg.svg, cfg.title, cfg.priorities, cfg.isDelete);
                } else if (zone === 'miniplayer') {
                    if (!row.hasAttribute('selected')) {
                        const cfg = BUTTON_FACTORY.delete;
                        createBtn(actionsWrapper, row, cfg.class, cfg.svg, 'Remove from queue', ['remove from queue', 'remove from', 'remove'], true);
                    }
                } else {
                    let userSelectedButtons = [];
                    if (USER_CONFIG[zone]) {
                        userSelectedButtons = Array.isArray(USER_CONFIG[zone]) ? USER_CONFIG[zone] : (USER_CONFIG[zone].active || []);
                    }

                    userSelectedButtons.forEach(btnKey => {
                        if (btnKey === 'download' && data.isLive) return;
                        if (btnKey === 'share' && isNews) return;
                        
                        const config = BUTTON_FACTORY[btnKey];
                        if (config) createBtn(actionsWrapper, row, config.class, config.svg, config.title, config.priorities, config.isDelete);
                    });
                }
            }
        }

        // ─── Toolbar Stats ────────────────────────────────────────────────────
        function updateToolbarStats(forceAnnounce = false) {
            const spanTotal = document.getElementById(SPAN_TOTAL_ID), spanProg = document.getElementById(SPAN_PROG_ID);
            if (!spanTotal || !spanProg) return;

            clearTimeout(state.mathSettleTimer);
            if (state.speed <= 0) { spanProg.textContent = 'Invalid Speed'; spanProg.style.color = 'red'; return; }

            try {
                const active = getActiveContainer();
                if (!active?.itemsEl) {
                    if (spanTotal.textContent !== 'No videos found.') {
                        spanTotal.textContent = 'No videos found.'; spanProg.textContent = '';
                        state.lastTotalText = 'No videos found.'; state.lastProgText = '';
                    }
                    return;
                }

                state.lastContainerType ??= null;
                if (state.lastContainerType !== active.type) { forceAnnounce = true; state.lastContainerType = active.type; }

                const validRows = getValidVideoRows(active.itemsEl), currentCount = validRows.length;
                state.lastCount ??= -1; state.lastSpeed ??= state.speed;

                if (currentCount === 0) {
                    if (spanTotal.textContent !== 'No videos found.') {
                        if (forceAnnounce) { spanTotal.textContent = ''; spanProg.textContent = ''; }
                        state.mathSettleTimer = setTimeout(() => {
                            spanTotal.textContent = 'No videos found.'; spanProg.textContent = '';
                            state.lastTotalText = 'No videos found.'; state.lastProgText = '';
                        }, forceAnnounce ? 350 : 50);
                        injectPlaylistHeaderButtons(0);
                    }
                    state.lastCount = 0; return;
                }

                if (state.loadInterval || document.querySelector('ytd-continuation-item-renderer tp-yt-paper-spinner[active]')) return;
                state.lastCount = currentCount; state.lastSpeed = state.speed;

                let totalSec = 0, watchedSec = 0;
                validRows.forEach((row, i) => {
                    const d = getVideoData(row, i);
                    if (d.duration > 0) { totalSec += d.duration; if (d.progress > 0) watchedSec += d.duration * (d.progress / 100); }
                });

                if (state.lastHref !== window.location.href) {
                    state.lastHref = window.location.href; state.initialCount = currentCount;
                    state.hasLoadedMore = false; state.allowRemoveBtn = false;
                }
                if (currentCount > (state.initialCount ?? 0) + 10) state.hasLoadedMore = true;
                if (!state.hasLoadedMore && watchedSec > 0) state.allowRemoveBtn = true;

                injectPlaylistHeaderButtons(state.allowRemoveBtn ? watchedSec : 0);

                const remaining = (totalSec - watchedSec) / state.speed, scaledTotal = totalSec / state.speed;
                let pct = totalSec > 0 ? Math.round((watchedSec / totalSec) * 100) : 0;
                if (watchedSec > 0 && pct === 0) pct = 1; if (watchedSec < totalSec && pct === 100) pct = 99;

                const totalText = `Total: ${currentCount} vids (${formatTime(scaledTotal)} at ${state.speed}x)`;
                const progText = `Progress: ${pct}% (${formatTime(remaining)} left)`;

                const isSpeedChange = state.prevSpeed !== undefined && state.prevSpeed !== state.speed;
                state.prevSpeed = state.speed;

                if (forceAnnounce) { spanTotal.textContent = ''; spanProg.textContent = ''; }

                state.mathSettleTimer = setTimeout(() => {
                    if (!forceAnnounce && spanTotal.textContent === totalText && spanProg.textContent === progText) return;
                    spanTotal.textContent = totalText; state.lastTotalText = totalText;
                    spanProg.textContent = progText; state.lastProgText = progText;
                    spanProg.style.color = pct === 100 ? '#4caf50' : '';
                }, isSpeedChange ? 50 : forceAnnounce ? 350 : 1200);
            } catch (e) { console.error(e); }
        }

        // ─── UI & Observers ───────────────────────────────────────────────────
        function injectToolbar(active) {
            if (!active?.itemsEl) return;
            const path = window.location.pathname;
            if (path === '/feed/playlists' || path.includes('/playlists') || path.includes('/shorts') || path.includes('premium_benefits')) {
                document.getElementById(CONTAINER_ID)?.remove(); return;
            }
            const video = document.querySelector('video.html5-main-video, video');
            if (video?.playbackRate) state.speed = video.playbackRate;

            let container = document.getElementById(CONTAINER_ID);
            if (container) {
                const speedInput = container.querySelector('input[type="number"]');
                if (speedInput && document.activeElement !== speedInput) speedInput.value = state.speed;
                const inCorrectPlace = path === '/watch' ? container.parentNode === active.itemsEl && container.previousElementSibling === null : container.nextElementSibling === active.itemsEl;
                if (!inCorrectPlace) path === '/watch' ? active.itemsEl.prepend(container) : active.itemsEl.parentNode.insertBefore(container, active.itemsEl);
                return;
            }

            container = createEl('div', 'yt-tools-toolbar'); container.id = CONTAINER_ID;
            const loadBtn = createEl('button', 'yt-tools-pill-btn', 'Load All');
            loadBtn.onclick = (e) => { e.preventDefault(); loadAllVideos(); };

            const sortSelect = createEl('select', 'yt-tools-input yt-tools-sort-select');
            [['index', 'Original Order'], ['title', 'Alphabetical'], ['channel', 'Channel Name'], ['date', 'Date Published'], ['duration', 'Length'], ['views', 'Most Popular'], ['progress', 'Watch Progress']].forEach(([val, lbl]) => {
                const o = document.createElement('option'); o.value = val; o.textContent = lbl; sortSelect.appendChild(o);
            });

            const dirSelect = createEl('select', 'yt-tools-input yt-tools-dir-select');
            [['asc', 'Ascending'], ['desc', 'Descending']].forEach(([val, lbl]) => {
                const o = document.createElement('option'); o.value = val; o.textContent = lbl; dirSelect.appendChild(o);
            });

            const speedInput = createEl('input', 'yt-tools-input');
            Object.assign(speedInput, { type: 'number', value: state.speed, step: '0.01', min: '0.25', max: '16' }); speedInput.style.width = '55px';

            const statusContainer = createEl('div', 'yt-tools-status-container'); statusContainer.id = STATUS_ID;
            const spanTotal = createEl('span', 'yt-tools-text-primary', ''); spanTotal.id = SPAN_TOTAL_ID; spanTotal.setAttribute('aria-live', 'polite'); spanTotal.setAttribute('aria-atomic', 'true');
            const spanProg = createEl('span', 'yt-tools-text-secondary', ''); spanProg.id = SPAN_PROG_ID; spanProg.setAttribute('aria-live', 'polite'); spanProg.setAttribute('aria-atomic', 'true');
            
            statusContainer.append(spanTotal, createEl('span', 'yt-tools-separator', '|'), spanProg);
            container.append(loadBtn, createEl('span', 'yt-tools-text-secondary', 'Sort:'), sortSelect, dirSelect, createEl('span', 'yt-tools-text-secondary', 'Speed:'), speedInput, statusContainer);
            path === '/watch' ? active.itemsEl.prepend(container) : active.itemsEl.parentNode.insertBefore(container, active.itemsEl);

            sortSelect.onchange = (e) => { state.sortType = e.target.value; runSort(); };
            dirSelect.onchange = (e) => { state.sortOrder = e.target.value; runSort(); };
            speedInput.onchange = (e) => {
                let val = Math.min(16, Math.max(0.25, parseFloat(e.target.value) || 1)); e.target.value = val;
                state.speed = state.userSetSpeed = val;
                const v = document.querySelector('video.html5-main-video, video'); if (v) v.playbackRate = val;
                updateAll();
            };
        }

        // ─── Load All ─────────────────────────────────────────────────────────
        function loadAllVideos() {
            const loadBtn   = document.querySelector(`#${CONTAINER_ID} .yt-tools-pill-btn`);
            const spanTotal = document.getElementById(SPAN_TOTAL_ID);
            const spanProg  = document.getElementById(SPAN_PROG_ID);
            const container = document.getElementById(CONTAINER_ID); // Grab the toolbar

            // --- THE RELEASE FUNCTION ---
            // Gently puts the toolbar back into the normal page flow
            const releaseToolbar = () => {
                if (container) {
                    container.style.position = '';
                    container.style.top = '';
                    container.style.left = '';
                    container.style.width = '100%';
                    container.style.zIndex = '1000';
                    container.style.boxShadow = '';
                }
                const spacer = document.getElementById('yt-tools-toolbar-spacer');
                if (spacer) spacer.remove();
            };

            if (state.loadInterval) {
                clearInterval(state.loadInterval);
                state.loadInterval = null;
                if (loadBtn) loadBtn.textContent = 'Load All';
                
                releaseToolbar(); // Put it back if stopped early
                
                updateAll(true);
                if (state.sortType !== 'index') runSort();
                return;
            }

            if (loadBtn) loadBtn.textContent = 'Stop...';

            const active = getActiveContainer();
            if (!active?.itemsEl) return;

            // --- THE DYNAMIC LOCK ---
            // Rips the toolbar out and staples it to the screen
            if (container) {
                const rect = container.getBoundingClientRect();
                
                // Leave a ghost behind so the video list doesn't jump
                let spacer = document.getElementById('yt-tools-toolbar-spacer');
                if (!spacer) {
                    spacer = document.createElement('div');
                    spacer.id = 'yt-tools-toolbar-spacer';
                    container.parentNode.insertBefore(spacer, container);
                }
                spacer.style.height = rect.height + 'px';
                spacer.style.width = '100%';
                spacer.style.marginBottom = window.getComputedStyle(container).marginBottom;

                // Lock the toolbar
                container.style.position = 'fixed';
                container.style.top = '90px';
                container.style.left = rect.left + 'px';
                container.style.width = rect.width + 'px';
                container.style.zIndex = '9999';
                container.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)'; // Add a slick drop-shadow while it floats
            }

            // The Fast-Count Fix
            let lastCount = active.itemsEl.querySelectorAll(ROW_SELECTOR).length;
            if (spanTotal) spanTotal.textContent = `Loading... (${lastCount} found)`;
            if (spanProg) spanProg.textContent = ''; 

            let retries = 0;

            const triggerScroll = () => {
                let spinner = active.itemsEl.querySelector('ytd-continuation-item-renderer');
                if (!spinner && window.location.pathname === '/watch')
                    spinner = document.querySelector('ytd-watch-flexy #secondary ytd-continuation-item-renderer');
                spinner ??= document.querySelector('ytd-continuation-item-renderer');

                if (spinner) {
                    spinner.scrollIntoView({ behavior: 'auto', block: 'end' });
                } else {
                    window.scrollTo(0, document.documentElement.scrollHeight);
                    const inner = document.querySelector('#secondary-inner');
                    if (inner) inner.scrollTop = inner.scrollHeight;
                }
                return spinner;
            };

            let lastSpinner = triggerScroll();

            state.loadInterval = setInterval(() => {
                const currentCount = active.itemsEl.querySelectorAll(ROW_SELECTOR).length;

                if (currentCount > lastCount) {
                    lastCount = currentCount;
                    retries   = 0;
                    if (spanTotal) spanTotal.textContent = `Loading... (${currentCount} found)`;
                    injectRowModifications();
                    updateAll(); 
                } else {
                    retries++;
                }

                if (retries > 5) {
                    clearInterval(state.loadInterval);
                    state.loadInterval = null;
                    if (loadBtn) loadBtn.textContent = 'Load All';

                    releaseToolbar(); // Put it back when finished!

                    window.dispatchEvent(new Event('resize'));
                    lastSpinner
                        ? active.itemsEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        : window.scrollTo(0, 0);

                    updateAll(true);
                    if (state.sortType !== 'index') runSort();
                    return;
                }

                lastSpinner = triggerScroll();
            }, 800);
        }

        function injectPlaylistHeaderButtons(watchedSec = 0) {
            if (!window.location.href.includes('list=WL')) return;
            const wrapper = document.querySelector('ytd-playlist-header-renderer .metadata-buttons-wrapper'), menuRenderer = wrapper?.querySelector('ytd-menu-renderer');
            let btnRemove = document.getElementById('yt-tools-clean-watched-btn');

            if (watchedSec <= 0 || isNaN(watchedSec)) { btnRemove?.remove(); return; }
            if (wrapper && menuRenderer && !btnRemove) {
                btnRemove = document.createElement('button'); btnRemove.id = 'yt-tools-clean-watched-btn';
                btnRemove.className = 'yt-spec-button-shape-next yt-spec-button-shape-next--tonal yt-spec-button-shape-next--overlay yt-spec-button-shape-next--size-m';
                btnRemove.style.cssText = 'margin-left:8px; margin-right:8px;';
                btnRemove.innerHTML = `<div class="yt-spec-button-shape-next__button-text-content"><span class="yt-core-attributed-string yt-core-attributed-string--white-space-no-wrap" role="text">Remove Watched</span></div>`;
                btnRemove.onclick = (e) => {
                    e.preventDefault(); const playlistMenuBtn = menuRenderer.querySelector('yt-icon-button button, button[aria-label="Action menu"]');
                    if (playlistMenuBtn) executeHiddenMenuAction(playlistMenuBtn, ['remove watched'], 'yt-confirm-dialog-renderer #confirm-button button, #confirm-button > yt-button-shape > button', () => updateAll());
                };
                wrapper.insertBefore(btnRemove, menuRenderer.nextSibling);
            }
        }

        function fixGlobalAccessibility() {
            const infoBar = document.querySelector('ytd-miniplayer-info-bar');
            if (!infoBar || infoBar.dataset.ytToolsGuarded) return;
            infoBar.dataset.ytToolsGuarded = 'true';
            const enforceLabel = () => {
                const btn = infoBar.querySelector('button'); if (!btn) return;
                if (btn.getAttribute('aria-label') !== 'Miniplayer queue') { btn.setAttribute('aria-label', 'Miniplayer queue'); btn.title = 'Miniplayer queue'; }
                if (!btn.querySelector('.yt-tools-sr-span')) {
                    const sr = document.createElement('span'); sr.className = 'yt-tools-sr-span'; sr.textContent = 'Miniplayer queue'; sr.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);border:0;';
                    btn.appendChild(sr);
                }
            };
            enforceLabel(); new MutationObserver(enforceLabel).observe(infoBar, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-label', 'title'] });
        }

        function updateQueueDuration() {
            const updateSpan = (panel, title, spanId, exClass) => {
                if (!panel || !title || title.getBoundingClientRect().width === 0) return;
                let tot = 0; panel.querySelectorAll('ytd-playlist-panel-video-renderer').forEach(r => {
                    if (!r.classList.contains('yt-tools-deleted')) { const ts = r.querySelector('.ytd-thumbnail-overlay-time-status-renderer, .badge-shape-wiz__text'); if (ts) tot += parseDurationFromText(ts.textContent); }
                });
                const txt = tot > 0 ? `• ${formatTime(tot)}` : ''; let span = document.getElementById(spanId);
                if (!span) {
                    span = createEl('span', `yt-tools-duration-span ${exClass}`.trim()); span.id = spanId;
                    const insert = (title.tagName.toLowerCase() === 'yt-formatted-string' && title.parentNode.tagName.toLowerCase() === 'h3') ? title.parentNode : title;
                    insert.parentNode.insertBefore(span, insert.nextSibling);
                }
                span.textContent = txt;
            };
            updateSpan(document.querySelector('ytd-miniplayer ytd-playlist-panel-renderer #items.playlist-items'), document.querySelector('.ytdMiniplayerInfoBarSubtitle h1'), QUEUE_SPAN_MINI, '');
            updateSpan(document.querySelector('ytd-watch-flexy #secondary ytd-playlist-panel-renderer#playlist #items.playlist-items'), document.querySelector('ytd-watch-flexy #secondary ytd-playlist-panel-renderer#playlist #header-description h3 .title, #title-text, .title.ytd-playlist-panel-renderer'), QUEUE_SPAN_PANEL, 'yt-tools-duration-span-panel');
        }

        function runSort() {
            state.isSorting = true;
            requestAnimationFrame(() => {
                try {
                    const { container, rows } = cleanAndGetRows(); if (!container || !rows.length) return;
                    const groups = {}; rows.forEach(el => { const gid = el.dataset.ytSortGroup || 'global'; (groups[gid] ??= []).push(el); });
                    Object.values(groups).forEach(groupRows => {
                        if (!groupRows.length) return;
                        const placeholders = groupRows.map(el => { const p = document.createElement('div'); p.className = 'yt-tools-sort-placeholder'; p.style.display = 'none'; el.parentNode.insertBefore(p, el); return p; });
                        const mapped = groupRows.map((el, i) => ({ el, data: getVideoData(el, i) }));
                        mapped.sort((a, b) => {
                            if (state.sortType !== 'index' && a.data.isLive !== b.data.isLive) return a.data.isLive ? -1 : 1;
                            if (state.sortType === 'channel' && a.data.isMovie !== b.data.isMovie) return a.data.isMovie ? -1 : 1;
                            const map = { index: d=>d.originalIndex, title: d=>d.title.toLowerCase(), channel: d=>d.channel.toLowerCase(), progress: d=>d.progress, date: d=>d.dateVal, views: d=>d.viewsVal, duration: d=>d.duration };
                            const vA = (map[state.sortType] || map.duration)(a.data), vB = (map[state.sortType] || map.duration)(b.data);
                            if (vA < vB) return state.sortOrder === 'asc' ? -1 : 1; if (vA > vB) return state.sortOrder === 'asc' ? 1 : -1;
                            return a.data.currentIndex - b.data.currentIndex;
                        });
                        mapped.forEach(({el}, i) => placeholders[i].parentNode.insertBefore(el, placeholders[i])); placeholders.forEach(p => p.remove());
                    });
                } finally { state.isSorting = false; updateAll(); }
            });
        }

        function updateAll(forceAnnounce = false) {
            if (state.isSorting || state.loadInterval || state.isNavigating) return;
            const run = () => {
                if (state.isSorting || state.loadInterval || state.isNavigating) return;
                fixGlobalAccessibility(); injectRowModifications(); updateQueueDuration(); updateToolbarStats(forceAnnounce);
            };
            window.requestIdleCallback ? window.requestIdleCallback(run, { timeout: 1000 }) : setTimeout(run, 50);
        }

        const mainObserver = new MutationObserver((mutations) => {
            if (state.isSorting || state.loadInterval) return;
            let needsUpdate = false, isExp = false, qToggle = false;
            for (const m of mutations) {
                if (m.type === 'attributes') {
                    if (m.attributeName === 'aria-expanded') { needsUpdate = qToggle = true; if (m.target.getAttribute('aria-expanded') === 'true') isExp = true; }
                    if (m.attributeName === 'collapsed') { needsUpdate = qToggle = true; if (!m.target.hasAttribute('collapsed')) isExp = true; }
                    if (m.attributeName === 'active' && m.target.tagName?.toLowerCase() === 'ytd-miniplayer') { needsUpdate = qToggle = isExp = true; }
                    if (m.attributeName === 'selected') needsUpdate = true;
                }
                if (m.addedNodes.length) {
                    for (const n of m.addedNodes) {
                        if (n.nodeType === 1 && (n.tagName?.includes('YTD-') || n.id === 'progress' || n.classList?.contains('ytp-play-progress'))) { needsUpdate = true; break; }
                    }
                }
            }
            if (!needsUpdate) return;
            mainObserver.disconnect(); clearTimeout(updateTimer);
            updateTimer = setTimeout(() => {
                const active = getActiveContainer(); if (active) { injectToolbar(active); updateAll(qToggle); } else document.getElementById(CONTAINER_ID)?.remove();
                startObserver();
            }, isExp ? 600 : 300);
        });

        function startObserver() { mainObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-expanded', 'active', 'selected', 'collapsed'] }); }
        startObserver();

        document.addEventListener('loadeddata', (e) => { if (e.target?.tagName?.toLowerCase() === 'video' && state.userSetSpeed && e.target.playbackRate !== state.userSetSpeed) e.target.playbackRate = state.userSetSpeed; }, true);
        document.addEventListener('ended', (e) => { if (e.target?.tagName?.toLowerCase() === 'video') setTimeout(() => updateAll(), 1000); }, true);
        document.addEventListener('ratechange', (e) => {
            if (e.target?.tagName?.toLowerCase() !== 'video') return;
            if (state.speed === e.target.playbackRate) return;
            state.speed = e.target.playbackRate;
            const input = document.querySelector(`#${CONTAINER_ID} input[type="number"]`); if (input && document.activeElement !== input) input.value = state.speed;
            updateAll();
        }, true);

        document.addEventListener('yt-navigate-start', () => {
            state.isNavigating = true; mainObserver.disconnect();
            if (state.loadInterval) { clearInterval(state.loadInterval); state.loadInterval = null; }
            Object.assign(state, { memoryVault: {}, sortType: 'index', sortOrder: 'asc', snapshotCounter: 0, lastCount: undefined, lastTotalText: '', lastProgText: '', lastContainerType: null, initialWatchedChecked: false, allowRemoveBtn: false });
            document.getElementById(CONTAINER_ID)?.remove();
        });

        document.addEventListener('yt-navigate-finish', () => {
            const video = document.querySelector('video.html5-main-video, video');
            if (video) { if (state.userSetSpeed && video.playbackRate !== state.userSetSpeed) video.playbackRate = state.userSetSpeed; state.speed = video.playbackRate; }
            setTimeout(() => { state.isNavigating = false; const active = getActiveContainer(); if (active) injectToolbar(active); updateAll(); startObserver(); }, 800);
        });

        // ─── Live Configuration Updates ───────────────────────────────────────
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'configUpdated' && request.config) {
                USER_CONFIG = request.config;
                updateAll(true);
            }
        });

        // ─── Kickstart the Engine ─────────────────────────────────────────────
        setTimeout(() => {
            const active = getActiveContainer();
            if (active) {
                injectToolbar(active);
                updateAll();
            }
        }, 300);

    });
})();