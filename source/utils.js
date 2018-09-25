"use strict";

const specialUrls =/chrome-extension:|chrome:|chrome-devtools:|file:|chrome.google.com\/webstore/;

let markedTabs = {};

/* Tabs */

let markForDiscard = tab => markedTabs[tab.id] = markedTabs[tab.id] || {};

let unmarkTab = tab => delete markedTabs[tab.id];

let isMarkedForDiscard = tab => markedTabs.hasOwnProperty(tab.id);

let isDiscarded = tab => tab.discarded;

let isActive = tab => tab.active;

let isVisible = (tab, win) => isActive(tab) && win && win.state !== 'minimized';    // @todo This has to be reviewd. Win === undefined?

let isLoaded = tab => tab.status === 'complete';

let isPinned = tab => tab.pinned;

let hasTitle = tab => markedTabs[tab.id].hasOwnProperty('title');

let hasFavicon = tab => markedTabs[tab.id].hasOwnProperty('favIconUrl');

let hasSpecialUrl = tab => specialUrls.test(tab.url);

let hasInfoForDiscard = (tab, changeInfo) => {
    // init minimal info before discard
    if (!markedTabs.hasOwnProperty(tab.id)) { return false; }
    if (changeInfo.title) { markedTabs[tab.id].title = changeInfo.title };
    if (changeInfo.favIconUrl) { markedTabs[tab.id].favIconUrl = changeInfo.favIconUrl };

    return hasTitle(tab) && hasFavicon(tab, changeInfo) || isLoaded(tab);

// return hasUrl(tab, changeInfo) && hasTitle(tab, changeInfo) && hasFavicon(tab, changeInfo);
// @todo Should discard regardless of status (otherwise doesn't save anything on big-sessions loading).
//      For convenience should at least check it has a favicon, a URL, and a proper (?) title.
}

let isReadyForDiscard = (tab, changeInfo) => isMarkedForDiscard(tab) && !isActive(tab) && hasInfoForDiscard(tab, changeInfo);


// let isToDiscard = tab => !isDiscarded(tab) && isMarkedForDiscard(tab);

// let hasUrl = (tab, changeInfo) => changeInfo.url || ( ''+tab.url ).length > 0;

// let hasTitle = (tab, changeInfo) => changeInfo.title || ( ''+tab.title ).length > 0;

// let hasTitle = tab => (tab.url && tab.title) && tab.url !== tab.title;

// let hasFavicon = (tab, changeInfo) => changeInfo.favicon || ( ''+tab.favIconUrl ).length > 0;
