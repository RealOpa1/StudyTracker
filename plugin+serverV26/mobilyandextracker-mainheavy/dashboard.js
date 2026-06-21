async function loadData() {
  const data = await browser.runtime.sendMessage({ type: 'GET_DASHBOARD_DATA' });
  if (!data || !data.visits) throw new Error('Нет данных');
  renderStats(data);
  renderTopSites(data);
  renderRecentVisits(data.visits);
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadData();
  } catch (e) {
    document.getElementById('statsRow').innerHTML = '<div class="error">Не удалось загрузить данные. Возможно, трекер отключён.</div>';
    document.getElementById('topContent').innerHTML = '';
    document.getElementById('recentContent').innerHTML = '';
  }

  document.getElementById('clearBtn').addEventListener('click', async () => {
    const btn = document.getElementById('clearBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Очистка...';
    const res = await browser.runtime.sendMessage({ type: 'CLEAR_HISTORY' });
    if (!res || !res.ok) {
      btn.textContent = '✖ Ошибка';
      setTimeout(() => { btn.textContent = '🗑 Очистить историю'; btn.disabled = false; }, 2000);
      return;
    }
    btn.textContent = '✓ Очищено';
    setTimeout(async () => {
      btn.textContent = '🗑 Очистить историю';
      btn.disabled = false;
      try {
        await loadData();
      } catch (e) {
        document.getElementById('statsRow').innerHTML = '<div class="empty-state"><div class="icon">📭</div><p>История пуста</p></div>';
        document.getElementById('topContent').innerHTML = '';
        document.getElementById('recentContent').innerHTML = '';
      }
    }, 800);
  });
});

function renderStats(data) {
  document.getElementById('statsRow').innerHTML = `
    <div class="stat-card">
      <div class="value">${data.totalVisits}</div>
      <div class="label">Всего визитов</div>
    </div>
    <div class="stat-card">
      <div class="value">${data.uniqueDomains}</div>
      <div class="label">Уникальных сайтов</div>
    </div>
    <div class="stat-card">
      <div class="value">${formatDuration(data.totalDuration)}</div>
      <div class="label">Общее время</div>
    </div>
  `;
}

function renderTopSites(data) {
  const top = data.topByCount;
  if (!top || top.length === 0) {
    document.getElementById('topContent').innerHTML = '<div class="empty-state"><div class="icon">📭</div><p>Пока нет посещённых сайтов</p></div>';
    return;
  }
  const maxCount = top[0].count;
  const maxDuration = data.topByDuration.length ? data.topByDuration[0].totalDuration : 1;
  const rows = top.map((site, i) => {
    const rankClass = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
    const countPct = (site.count / maxCount) * 100;
    const durSite = data.topByDuration.find(d => d.domain === site.domain);
    const durPct = durSite ? (durSite.totalDuration / maxDuration) * 100 : 0;
    return `
      <tr>
        <td><span class="rank-num ${rankClass}">${i + 1}</span></td>
        <td class="domain-cell">${site.domain}</td>
        <td>
          <div class="duration-bar-wrap">
            <span class="tag count">${site.count}×</span>
            <div class="duration-bar"><div class="fill" style="width:${countPct}%"></div></div>
          </div>
        </td>
        <td>
          <div class="duration-bar-wrap">
            <span class="tag time">${formatDuration(durSite ? durSite.totalDuration : 0)}</span>
            <div class="duration-bar"><div class="fill" style="width:${durPct}%"></div></div>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  document.getElementById('topContent').innerHTML = `
    <table>
      <thead><tr><th>#</th><th>Сайт</th><th>Визиты</th><th>Время</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function renderRecentVisits(visits) {
  if (!visits || visits.length === 0) {
    document.getElementById('recentContent').innerHTML = '<div class="empty-state"><div class="icon">📭</div><p>Последних визитов нет</p></div>';
    return;
  }
  const rows = visits.slice(0, 30).map(v => {
    const time = new Date(v.timestamp);
    const dateStr = time.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    const timeStr = time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    return `
      <tr>
        <td class="domain-cell">${v.domain}</td>
        <td><a href="${escapeHtml(v.url)}" target="_blank" style="color:#586069;text-decoration:none;font-size:12px;">${escapeHtml(truncate(v.title || v.url, 60))}</a></td>
        <td class="time-col">${dateStr} ${timeStr}</td>
        <td class="time-col">${formatDuration(v.duration)}</td>
      </tr>
    `;
  }).join('');
  document.getElementById('recentContent').innerHTML = `
    <table>
      <thead><tr><th>Сайт</th><th>Страница</th><th>Дата</th><th>Время</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0s';
  if (seconds < 60) return `${Math.round(seconds)}с`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}м ${Math.round(seconds % 60)}с`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}ч ${m}м`;
}

function truncate(str, len) {
  return str.length > len ? str.slice(0, len) + '...' : str;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
