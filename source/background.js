(function(tabs, windows){

    "use strict";

    const specialUrls =/chrome-extension:|chrome:|chrome-devtools:|file:|chrome.google.com\/webstore/;

    /* Utils */
    let markedTabs = [];
    let tabsWithInfo = {};
    let markForDiscard = (tab) => markedTabs.push(tab.id);
    let unmarkTab = (tab) => markedTabs.splice(markedTabs.indexOf(tab.id), 1);
    let isMarkedForDiscard = (tab) => markedTabs.includes(tab.id);
    let isDiscarded = (tab) => tab.discarded;
    let isVisible = (tab, win) => tab.active && win.state !== 'minimized';
    let isLoaded = (tab) => tab.status === 'complete';
    let isPinned = (tab) => tab.pinned;
    let isToDiscard = (tab) => !isDiscarded(tab) && isMarkedForDiscard(tab);
    let hasUrl = (tab, changeInfo) => changeInfo.url || ( ''+tab.url ).length > 0;
    // let hasTitle = (tab, changeInfo) => changeInfo.title || ( ''+tab.title ).length > 0;
    let hasTitle = (tab) => (tab.url && tab.title) && tab.url !== tab.title;
    let hasFavicon = (tab, changeInfo) => changeInfo.favicon || ( ''+tab.favIconUrl ).length > 0;
    let hasInfoForDiscard = (tab, changeInfo) => {
if (changeInfo.title) { console.log(changeInfo.title)};
        // assume that favIconUrl is initialised before title
        // assume that title meta is different from url; otherwise waits till tab is loaded
        return hasTitle(tab) && hasFavicon(tab, changeInfo) || isLoaded(tab);

// @todo Avoid false positives when url or title are undefined

// return hasUrl(tab, changeInfo) && hasTitle(tab, changeInfo) && hasFavicon(tab, changeInfo);
// @todo Should discard regardless of status (otherwise doesn't save anything on big-sessions loading).
//      For convenience should at least check it has a favicon, a URL, and a proper (?) title.
    }

    // @todo test behaviour with minimized window

    let discardAllTabs = () => {
        windows.getAll({populate: true}, windowsList => windowsList.forEach( win => {
            win.tabs.forEach( tab => {
                if(isDiscarded(tab)) { return; }
                if(isPinned(tab)) { return; }
                if(isVisible(tab, win)) { return; }
                if(tab.url && specialUrls.test(tab.url)){ return; }
                tabs.discard(tab.id);
            } )
        } ));
    };

    let discardCreatedTab = (tab) => {
// console.log('CREATED - discardCreatedTab => markForDiscard', tab.url, '<--url');
        markForDiscard(tab);
        // console.log('set', tab.id, 'as to discAfterCreation', isMarkedForDiscard(tab));
    }

    let discardMarkedTab = (tabId, changeInfo, tab) => {
// console.log('UPDATED', tab.id, 'discarded',tab.discarded, 'discAfterCreate', isMarkedForDiscard(tab), changeInfo);
// if (changeInfo.url) {console.log('set url to ', changeInfo.url, tab.url)};
        if (isToDiscard(tab) && hasInfoForDiscard(tab, changeInfo)) {
            discardInactiveTab(tab);
        }
    }

    let discardInactiveTab = (tab) => {
console.log('discardInactiveTab', tab);
        let win;
        chrome.windows.get(tab.windowId, {populate: false}, (tab_window) => win = tab_window);
        if (!isDiscarded(tab) && !isVisible(tab, win) && !isPinned(tab)) {
            chrome.tabs.discard(tab.id);
            unmarkTab(tab);
console.log('discarded tab', tab.id, markedTabs.indexOf(tab.id) === -1);
        }
    };

    chrome.browserAction.onClicked.addListener( discardAllTabs );
    chrome.runtime.onStartup.addListener( discardAllTabs );
    chrome.tabs.onCreated.addListener( discardCreatedTab );
    chrome.tabs.onUpdated.addListener( discardMarkedTab );

})(chrome.tabs, chrome.windows);
