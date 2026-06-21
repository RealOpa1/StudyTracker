let startTime = Date.now();
let isActive = true;
let lastActiveSent = 0;

browser.runtime.sendMessage({ type: 'PAGE_LOAD', url: window.location.href });

document.addEventListener('visibilitychange', () => {
  isActive = !document.hidden;
  if (isActive) {
    startTime = Date.now();
  } else {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    browser.runtime.sendMessage({ type: 'PAGE_HIDE', duration, url: window.location.href });
  }
});

['click', 'scroll', 'keydown', 'mousemove'].forEach(eventType => {
  document.addEventListener(eventType, () => {
    if (isActive) {
      const now = Date.now();
      if (now - lastActiveSent > 2000) {
        lastActiveSent = now;
        browser.runtime.sendMessage({ type: 'USER_ACTIVE' });
      }
    }
  }, { passive: true });
});

window.addEventListener('beforeunload', () => {
  const duration = Math.floor((Date.now() - startTime) / 1000);
  browser.runtime.sendMessage({ type: 'PAGE_UNLOAD', duration, url: window.location.href });
});

function getPageText() {
  const titleEl = document.querySelector('.question-hyperlink, #question-header .question-hyperlink');
  const bodyEl = document.querySelector('.question .s-prose, .question .post-text');
  const parts = [];
  if (titleEl) parts.push(titleEl.textContent.trim());
  if (bodyEl) parts.push(bodyEl.textContent.trim());
  return parts.join('\n\n').slice(0, 10000);
}

async function sendPageForRecommendation() {
  const text = getPageText();
  if (!text || text.length < 100) return;
  const { anonId } = await browser.storage.local.get('anonId');
  if (!anonId) return;
  browser.runtime.sendMessage({
    type: 'GET_RECOMMENDATION',
    data: { url: window.location.href, title: document.title, text, anon_id: anonId }
  }, (response) => {
    if (response && response.recommendations && response.recommendations.length > 0) {
      showRecommendations(response.recommendations);
    }
  });
}

function showRecommendations(recommendations) {
  const oldBox = document.getElementById('yt-so-recommend');
  if (oldBox) oldBox.remove();
  const box = document.createElement('div');
  box.id = 'yt-so-recommend';
  box.style.cssText = [
    'position:fixed;bottom:20px;right:20px;width:340px;background:#fff;border-radius:12px;',
    'box-shadow:0 4px 16px rgba(0,0,0,0.2);z-index:10001;',
    'font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:14px;',
    'border:1px solid #e1e4e8;overflow:hidden;'
  ].join('');
  const header = document.createElement('div');
  header.style.cssText = 'background:#4a76a8;color:white;padding:10px 12px;font-weight:bold;display:flex;justify-content:space-between;align-items:center;';
  const headerSpan = document.createElement('span');
  headerSpan.textContent = '📚 Похожие вопросы на StackOverflow';
  const closeBtn = document.createElement('button');
  closeBtn.id = 'yt-so-close';
  closeBtn.textContent = '\u00D7';
  closeBtn.style.cssText = 'background:none;border:none;color:white;font-size:18px;cursor:pointer;';
  header.appendChild(headerSpan);
  header.appendChild(closeBtn);
  const list = document.createElement('div');
  list.style.padding = '8px 12px';
  recommendations.forEach(rec => {
    const item = document.createElement('div');
    item.style.margin = '8px 0';
    const link = document.createElement('a');
    link.href = rec.link;
    link.target = '_blank';
    link.textContent = rec.title;
    link.style.cssText = 'color:#4a76a8;text-decoration:none;font-weight:500;';
    item.appendChild(link);
    const meta = document.createElement('div');
    meta.style.cssText = 'font-size:12px;color:#586069;margin-top:2px;';
    meta.textContent = `📊 расстояние: ${rec.distance}`;
    item.appendChild(meta);
    list.appendChild(item);
  });
  box.appendChild(header);
  box.appendChild(list);
  document.body.appendChild(box);
  closeBtn.onclick = () => box.remove();
  setTimeout(() => {
    const stillThere = document.getElementById('yt-so-recommend');
    if (stillThere) stillThere.remove();
  }, 15000);
}

setTimeout(sendPageForRecommendation, 4000);