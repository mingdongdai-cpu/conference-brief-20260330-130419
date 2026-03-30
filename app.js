const el = (selector) => document.querySelector(selector);

function formatNumber(value) {
  if (typeof value === 'number') {
    return value.toLocaleString('en-US');
  }
  return value ?? '-';
}

function parseNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatCell(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return value.toLocaleString('en-US');
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
  return String(value).replace(/\n+/g, ' / ').trim() || '-';
}

function isMainVisual(name) {
  return /^主视觉\d*\.jpg$/i.test(name);
}

function isImageFile(name) {
  return /\.(png|jpe?g|webp|gif)$/i.test(name);
}

function prettyName(name) {
  return name.replace(/\.[^.]+$/, '');
}

function sortGalleryImages(images) {
  const priority = [
    '场地鸟瞰图.png',
    '舞台效果图.png',
    '狮军.jpg',
    '新晋8星.jpg',
    '旅游奖.jpg',
    '摩托车奖.png',
    '奖杯.png',
    '手拍.png',
  ];
  const rank = new Map(priority.map((name, index) => [name, index]));
  return [...images].sort((a, b) => {
    const aRank = rank.has(a) ? rank.get(a) : Number.MAX_SAFE_INTEGER;
    const bRank = rank.has(b) ? rank.get(b) : Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    return a.localeCompare(b, 'zh-CN');
  });
}

function renderMeta(data) {
  el('#eventTitle').textContent = data.meta.title;
  el('#eventSubtitle').textContent = data.meta.subtitle;

  const heroMeta = el('#heroMeta');
  const metaItems = [
    `日期：${data.meta.date}`,
    `地点：${data.meta.location}`,
    `规模：${data.meta.scale}`,
    `基调：${data.meta.tone}`,
  ];

  heroMeta.innerHTML = metaItems
    .map((item) => `<span class="meta-pill">${item}</span>`)
    .join('');
}

function renderGallery(data) {
  const galleryImages = sortGalleryImages(data.assets.images.filter((name) => !isMainVisual(name)));
  el('#imageGallery').innerHTML = galleryImages
    .map(
      (name) => `
      <figure class="fade-in" role="button" tabindex="0" data-image="./assets/${name}" data-caption="${prettyName(name)}" aria-label="查看大图 ${prettyName(name)}">
        <img src="./assets/${name}" alt="${prettyName(name)}" loading="lazy" />
        <figcaption>${prettyName(name)}</figcaption>
      </figure>
    `,
    )
    .join('');
}

function setupHeroTitleToggle() {
  const button = el('#heroTitleToggle');
  const info = el('#heroInfo');
  const hero = el('.hero');
  if (!button || !info || !hero) return;

  let hidden = false;
  button.addEventListener('click', () => {
    hidden = !hidden;
    info.classList.toggle('is-hidden', hidden);
    hero.classList.toggle('focus-video', hidden);
    button.textContent = hidden ? '显示标题' : '隐藏标题';
    button.setAttribute('aria-expanded', hidden ? 'false' : 'true');
  });
}

function setupLightbox() {
  const lightbox = el('#lightbox');
  const lightboxImage = el('#lightboxImage');
  const lightboxCaption = el('#lightboxCaption');
  const closeBtn = el('#lightboxClose');
  const figures = Array.from(document.querySelectorAll('#imageGallery figure'));

  if (!lightbox || !lightboxImage || !lightboxCaption || !closeBtn || !figures.length) return;

  const open = (src, caption) => {
    lightboxImage.src = src;
    lightboxCaption.textContent = caption || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImage.src = '';
    document.body.style.overflow = '';
  };

  figures.forEach((figure) => {
    const src = figure.getAttribute('data-image');
    const caption = figure.getAttribute('data-caption');
    figure.addEventListener('click', () => open(src, caption));
    figure.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open(src, caption);
      }
    });
  });

  closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) close();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && lightbox.classList.contains('open')) close();
  });
}

function renderTimeline(data) {
  const list = el('#timelineList');
  list.innerHTML = data.timeline
    .map((node) => {
      if (node.type === 'chapter') {
        return `
          <article class="timeline-chapter fade-in">
            <h3>${node.section} · ${node.title}</h3>
            <p><strong>${node.time}</strong> ｜ 核心任务：${node.mission || '-'}</p>
          </article>
        `;
      }

      return `
        <article class="timeline-item fade-in">
          <div class="timeline-row-top">
            <span class="timeline-tag">#${node.seq} ${node.chapter || ''}</span>
            <span class="timeline-time">${node.time || '-'}</span>
          </div>
          <div class="timeline-title">${node.segment || '-'}</div>
          <div class="timeline-detail">核心任务：${node.mission || '-'}</div>
          <div class="timeline-detail">执行内容：${node.content || '-'}</div>
          <div class="timeline-detail">音视频/灯光：${node.av || '-'}</div>
        </article>
      `;
    })
    .join('');
}

function renderAttendance(data) {
  el('#branchTable').innerHTML = data.branches
    .map(
      (row) => `
      <tr>
        <td>${row.seq}</td>
        <td>${row.country || '-'}</td>
        <td>${row.range || '-'}</td>
        <td>${formatNumber(row.min)}</td>
        <td>${formatNumber(row.max)}</td>
        <td>${row.note || '-'}</td>
      </tr>
    `,
    )
    .join('');

  if (data.branchTotal) {
    el('#branchTotal').textContent = `${data.branchTotal.label}：${formatNumber(data.branchTotal.min)} - ${formatNumber(data.branchTotal.max)} 人（${data.branchTotal.note || '范围合计'}）`;
  }
}

function renderBudget(data) {
  el('#budgetTable').innerHTML = data.budget.rows
    .map((row) => {
      const cfa = parseNumber(row.cfa);
      const usd = parseNumber(row.usd);
      const cfaText = cfa === null ? row.cfa || '-' : `${formatNumber(cfa)} CFA`;
      const usdText = usd === null ? row.usd || '-' : `${usd.toLocaleString('en-US', { maximumFractionDigits: 2 })} USD`;
      return `
        <tr>
          <td>${row.category || '-'}</td>
          <td>${row.spec || '-'}</td>
          <td>${cfaText}</td>
          <td>${usdText}</td>
        </tr>
      `;
    })
    .join('');

  const totalCfa = parseNumber(data.budget.total.cfa);
  const totalUsd = parseNumber(data.budget.total.usd);
  const totalText = `总计预估：${totalCfa ? formatNumber(totalCfa) + ' CFA' : '-'} ｜ ${
    totalUsd ? totalUsd.toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' USD' : '-'
  } ｜ 整体预估区间：${data.budget.total.overall || '-'}`;
  el('#budgetTotal').textContent = totalText;
}

function renderStaffing(data) {
  const staffing = data.staffing;
  if (!staffing || !Array.isArray(staffing.groups)) return;

  const rows = staffing.groups.flatMap((group) =>
    group.roles.map((role, index) => ({
      showGroup: index === 0,
      group: group.group,
      groupTotal: group.total,
      rowSpan: group.roles.length,
      role: role.role,
      count: role.count,
    })),
  );

  el('#staffingTable').innerHTML = rows
    .map(
      (row) => `
      <tr>
        ${row.showGroup ? `<td rowspan="${row.rowSpan}">${row.group}</td>` : ''}
        ${row.showGroup ? `<td rowspan="${row.rowSpan}">${formatNumber(row.groupTotal)}</td>` : ''}
        <td>${row.role || '-'}</td>
        <td>${formatNumber(row.count)}</td>
      </tr>
    `,
    )
    .join('');

  const summary = staffing.groups.map((group) => `${group.group}${formatNumber(group.total)}人`).join('，');
  el('#staffingTotal').textContent = `服务保障总人数：${formatNumber(staffing.grandTotal)} 人（${summary}）`;
}

function renderMaterials(data) {
  if (!Array.isArray(data.materials)) return;

  const isPendingMaterial = (row) => {
    const material = typeof row.material === 'string' ? row.material.trim() : '';
    const subItem = typeof row.subItem === 'string' ? row.subItem.trim() : '';
    const item = typeof row.item === 'string' ? row.item.trim() : '';
    return (!material && !subItem) || item === '待补充';
  };

  const visibleMaterials = data.materials.filter((row) => !isPendingMaterial(row));

  const grouped = visibleMaterials.reduce((acc, row) => {
    const key = row.group || '未分组';
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key).push(row);
    return acc;
  }, new Map());

  const toMaterialLabel = (row) => {
    const main = row.material ?? row.item ?? '';
    const sub = row.subItem ?? '';
    if (main && sub) return { main, sub };
    if (main) return { main, sub: '-' };
    if (sub) return { main: sub, sub: '-' };
    return { main: '待补充', sub: '-' };
  };

  const groupSections = Array.from(grouped.entries()).map(([group, rows]) => {
    const body = rows
      .map((row) => {
        const material = toMaterialLabel(row);
        const pendingMain = material.main === '待补充';
        const pendingExtra = row.pendingDetails || row.pending || '-';
        const noteProgress = [row.note, row.progress].filter((v) => v && v !== '-').join(' ｜ ') || '-';
        return `
          <tr>
            <td>${formatCell(row.seq)}</td>
            <td>${pendingMain ? '<span class="pending-text">待补充</span>' : formatCell(material.main)}</td>
            <td>${formatCell(material.sub)}</td>
            <td>${formatCell(row.spec)}</td>
            <td>${formatCell(row.materialType)}</td>
            <td>${formatCell(row.quantity)}</td>
            <td>${formatCell(row.unitPrice)}</td>
            <td>${formatCell(row.budget)}</td>
            <td>${formatCell(row.process)}</td>
            <td>${formatCell(noteProgress)}</td>
            <td>${formatCell(Array.isArray(pendingExtra) ? pendingExtra.join('；') : pendingExtra)}</td>
          </tr>
        `;
      })
      .join('');

    return `
      <section class="material-group-block">
        <div class="material-group-head">
          <h3>${group}</h3>
          <span>${rows.length} 项</span>
        </div>
        <div class="table-wrap material-table-wrap">
          <table>
            <thead>
              <tr>
                <th>序号</th>
                <th>物料</th>
                <th>子项</th>
                <th>规格尺寸</th>
                <th>材质</th>
                <th>数量</th>
                <th>单价</th>
                <th>预算</th>
                <th>工艺</th>
                <th>备注/进度</th>
                <th>待定补充</th>
              </tr>
            </thead>
            <tbody>${body}</tbody>
          </table>
        </div>
      </section>
    `;
  });

  const total = visibleMaterials.length;
  const groupText = Array.from(grouped.entries())
    .map(([group, rows]) => `${group}${rows.length}项`)
    .join('，');

  el('#materialGroups').innerHTML = groupSections.join('');
  el('#materialSummary').textContent = `物料合计：${total} 项（${groupText}）`;
}

function renderDownloads(data) {
  const files = [...data.assets.excels, data.assets.video, ...sortGalleryImages(data.assets.images.filter((name) => !isMainVisual(name)))];
  el('#downloadList').innerHTML = files
    .map(
      (name) => `
      <a class="download-item" href="./assets/${name}" download>
        <span class="download-name">${isImageFile(name) ? prettyName(name) : name}</span>
      </a>
    `,
    )
    .join('');
}

async function init() {
  try {
    let data = null;
    if (window.CONFERENCE_DATA) {
      data = window.CONFERENCE_DATA;
    } else {
      const response = await fetch('./data.json');
      data = await response.json();
    }

    renderMeta(data);
    renderGallery(data);
    renderTimeline(data);
    renderAttendance(data);
    renderBudget(data);
    renderStaffing(data);
    renderMaterials(data);
    renderDownloads(data);
    setupHeroTitleToggle();
    setupLightbox();
  } catch (error) {
    document.body.innerHTML = `<main class="container" style="padding: 2rem;"><h2>数据加载失败</h2><p>${String(error)}</p></main>`;
  }
}

init();
