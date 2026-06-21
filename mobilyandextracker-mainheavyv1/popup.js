document.addEventListener('DOMContentLoaded', () => {
  const statusDiv = document.getElementById('status');
  const toggleBtn = document.getElementById('toggleBtn');

  browser.storage.local.get(['trackingEnabled']).then((result) => {
    updateUI(result.trackingEnabled === true);
  });

  toggleBtn.addEventListener('click', () => {
    browser.storage.local.get(['trackingEnabled']).then((result) => {
      const newState = !result.trackingEnabled;
      browser.storage.local.set({ trackingEnabled: newState }).then(() => {
        updateUI(newState);
        browser.runtime.sendMessage({ type: 'TRACKING_TOGGLE', enabled: newState });
      });
    });
  });

  function updateUI(enabled) {
    if (enabled) {
      statusDiv.textContent = 'Отслеживание активно';
      statusDiv.className = 'status on';
      toggleBtn.textContent = 'Отключить отслеживание';
    } else {
      statusDiv.textContent = 'Отслеживание отключено';
      statusDiv.className = 'status off';
      toggleBtn.textContent = 'Включить отслеживание';
    }
  }
});