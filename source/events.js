"use strict";

// @todo add sending of mesages (for inter-extension comunication)
//          chrome.runtime.sendMessage(string extensionId, any message, object options, function responseCallback)

    let discardedTabsCounter = 0;

    let discardTab = (tab, win) => {
        if(isDiscarded(tab)) { return; }
        if(isPinned(tab)) { return; }
        if(isVisible(tab, win)) { return; }
        if(tab.url && hasSpecialUrl(tab)){ return; }
        chrome.tabs.discard(tab.id);
        if (chrome.runtime.lastError) {
            console.warn('Lazy Tabs was unable to discard tab ' + tab.id);
        }
    };

    let discardTabs = () => {
        let hasHighlightedTabs = false;
        let currentWindow;
        // if tabs are hightlighted in currentWindow then discard just those
        chrome.windows.getCurrent({populate: false}, win => currentWindow = win);
        chrome.tabs.query(
            { currentWindow: true, highlighted: true },
            result => {
console.log('Found ' + result.length + ' highlighted tabs');
                hasHighlightedTabs = result.length > 0;
                result.forEach( tab => discardTab(tab, currentWindow) )
            }
        );
        // otherwise discard all by default
        if (!hasHighlightedTabs) {
console.log('No tab highlighted. Discard all tabs in all windows');
            discardAllTabs();
        } else {
console.log('Highlighted tabs discarded');
        }
    }

    let discardAllTabs = () => {

        chrome.windows.getAll({populate: true}, windowsList => windowsList.forEach( win => {
            if (win.tabs && Array.isArray(win.tabs)) {
                win.tabs.forEach( tab => discardTab(tab, win) );
            } else {
                console.warn('Lazy Tabs did not find tabs to discard in window ' + win.id);
            }
        } ));
    };

    let discardHighlightedTabs = () => {

        chrome.windows.getAll({populate: true}, windowsList => windowsList.forEach( win => {
            if (win.tabs && Array.isArray(win.tabs)) {
                chrome.tabs.query(
                    { windowId: win.id, highlighted: true, status: 'complete' },
                    result => result.forEach( tab => discardTab(tab, win) )
                );
            } else {
                console.warn('Lazy Tabs did not find any highlighted tab to discard in window ' + win.id);
            }
        } ));
    };

    let discardCreatedTab = (tab) => {
if (tab.active) { return; } // this is maybe just to keep in 'discardInactiveTab()'
console.log('CREATED', tab.url);
        if (!hasSpecialUrl(tab)) {
            // don't discard special tabs
        }
markForDiscard(tab);
// discardInactiveTab(tab);
        // console.log('set', tab.id, 'as to discAfterCreation', isMarkedForDiscard(tab));
    }

    let discardMarkedTab = (tabId, changeInfo, tab) => {
// console.log('UPDATED', tab.id, !isDiscarded(tab), 'isReadyForDiscard', isReadyForDiscard(tab, changeInfo), isMarkedForDiscard(tab), !isActive(tab), !isDiscarded(tab), hasInfoForDiscard(tab, changeInfo));
// if (changeInfo.url) {console.log('set url to ', changeInfo.url, tab.url)};
        if (!isDiscarded(tab) && isReadyForDiscard(tab, changeInfo)) {
        // if (!isDiscarded(tab) && !isActive(tab)) {
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
            if (chrome.runtime.lastError) {
                console.warn('Lazy Tabs was unable to discard tab ' + tab.id);
            } else {
console.log(++discardedTabsCounter);
console.log('discarded tab', tab.id, isMarkedForDiscard(tab));
            }
        }
        unmarkTab(tab);
    };

chrome.browserAction.onClicked.addListener( discardTabs );
chrome.runtime.onStartup.addListener( discardAllTabs );
chrome.tabs.onCreated.addListener( discardCreatedTab );
chrome.tabs.onActivated.addListener( unmarkTab );
chrome.tabs.onUpdated.addListener( discardMarkedTab );
// chrome.webNavigation.onTabReplaced.addListener( () => {
//     // @todo When replaced (after discard), update the id for the eventual discarded tab saved-state
// });