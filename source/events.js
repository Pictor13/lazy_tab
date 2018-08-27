"use strict";

// @todo test behaviour with minimized window

    let discardedTabsCounter = 0;
    
    let discardAllTabs = () => {
console.log('discardAllTabs');
        chrome.windows.getAll({populate: true}, windowsList => windowsList.forEach( win => {
            win.tabs.forEach( tab => {
                if(isDiscarded(tab)) { return; }
                if(isPinned(tab)) { return; }
                if(isVisible(tab, win)) { return; }
                if(tab.url && isSpecialUrl(tab)){ return; }
                tabs.discard(tab.id);
            } )
        } ));
    };

    let discardCreatedTab = (tab) => {
if (tab.active) { return; } // this is maybe just to keep in 'discardInactiveTab()'
// console.log('CREATED - discardCreatedTab => markForDiscard', tab.url, '<--url');
        if (!isSpecialUrl(tab)) {
            // don't discard special tabs
        }
        markForDiscard(tab);
        // console.log('set', tab.id, 'as to discAfterCreation', isMarkedForDiscard(tab));
    }

    let discardMarkedTab = (tabId, changeInfo, tab) => {
// console.log('UPDATED', tab.id, !isDiscarded(tab), 'isReadyForDiscard', isReadyForDiscard(tab, changeInfo), isMarkedForDiscard(tab), !isActive(tab), !isDiscarded(tab), hasInfoForDiscard(tab, changeInfo));
// if (changeInfo.url) {console.log('set url to ', changeInfo.url, tab.url)};
        if (!isDiscarded(tab) && isReadyForDiscard(tab, changeInfo)) {
            discardInactiveTab(tab);    // @todo Debounce it to not risk repetitions of the command
        }
    }

    let discardInactiveTab = (tab) => {
// console.log('discardInactiveTab', tab, isActive(tab) ? 'WARN: tab is STILL active':null);
// console.log('discard, as long as !isDiscarded(tab) && isMarkedForDiscard(tab) && !isActive(tab)', !isDiscarded(tab), isMarkedForDiscard(tab), !isActive(tab));
        let win;
        chrome.windows.get(tab.windowId, {populate: false}, (tab_window) => win = tab_window);
        if (!isDiscarded(tab) && !isVisible(tab, win) && !isPinned(tab)) {
            chrome.tabs.discard(tab.id);
// console.log(++discardedTabsCounter);
console.log('discarded tab', tab.id, isMarkedForDiscard(tab));
        }
        unmarkTab(tab);
    };

chrome.browserAction.onClicked.addListener( discardAllTabs );
chrome.runtime.onStartup.addListener( discardAllTabs );
chrome.tabs.onCreated.addListener( discardCreatedTab );
chrome.tabs.onActivated.addListener( unmarkTab );
chrome.tabs.onUpdated.addListener( discardMarkedTab );
// chrome.webNavigation.onTabReplaced.addListener( () => {
//     // @todo When replaced (after discard), update the id for the eventual discarded tab saved-state
// });