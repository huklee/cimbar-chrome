const APP_URL = chrome.runtime.getURL('app.html');

async function openEditor() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['TAB'],
    documentUrls: [APP_URL],
  });
  if (contexts.length > 0) {
    const context = contexts[0];
    await chrome.tabs.update(context.tabId, { active: true });
    if (context.windowId !== undefined) {
      await chrome.windows.update(context.windowId, { focused: true });
    }
    return;
  }
  await chrome.tabs.create({ url: APP_URL });
}

chrome.action.onClicked.addListener(() => {
  openEditor().catch((error) => console.error('Unable to open editor', error));
});
