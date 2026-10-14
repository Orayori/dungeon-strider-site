(() => {
  const root = document.getElementById('items-results');
  const count = document.getElementById('items-count');
  const search = document.getElementById('item-search');
  const slotFilter = document.getElementById('slot-filter');
  const rarityFilter = document.getElementById('rarity-filter');
  const tierFilter = document.getElementById('tier-filter');
  const sortFilter = document.getElementById('sort-filter');
  const items = window.DS_CODEX?.items || [];
  const number = (v) => Number(v || 0).toLocaleString();
  const titleCase = (s) => String(s || '').replace(/[_-]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderCard(item) {
    const card = make('article', 'item-card');
    const art = make('div', 'art');
    if (item.sprite) {
      const img = make('img');
      img.src = item.sprite;
      img.alt = `${item.name} sprite`;
      img.loading = 'lazy';
      img.width = 128;
      img.height = 128;
      art.append(img);
    } else {
      art.append(make('span', 'muted', 'No sprite'));
    }
    const content = make('div', 'item-content');
    content.append(make('h3', '', item.name || 'Unnamed item'));
    const meta = make('div', 'item-meta');
    meta.append(make('span', 'pill', `Tier ${item.tier}`));
    meta.append(make('span', `pill rarity-${String(item.rarity || '').toLowerCase()}`, titleCase(item.rarity)));
    meta.append(make('span', 'pill', titleCase(item.slot)));
    content.append(meta);
    if (item.desc) content.append(make('p', 'item-desc', item.desc));
    const stats = make('div', 'item-stats');
    stats.append(make('span', 'stat-chip atk', `ATK +${number(item.atk)}`));
    stats.append(make('span', 'stat-chip def', `DEF +${number(item.def)}`));
    stats.append(make('span', 'stat-chip hp', `HP +${number(item.hp)}`));
    content.append(stats);
    content.append(make('div', 'price', `${number(item.price)} SC`));
    card.append(art, content);
    return card;
  }

  function update() {
    const query = search.value.trim().toLowerCase();
    const slot = slotFilter.value;
    const rarity = rarityFilter.value;
    const tier = tierFilter.value ? Number(tierFilter.value) : null;
    const matches = items.filter((item) => {
      const blob = `${item.name} ${item.desc} ${item.id} ${item.slot} ${item.rarity}`.toLowerCase();
      return (!query || blob.includes(query))
        && (slot === 'all' || item.slot === slot)
        && (rarity === 'all' || item.rarity === rarity)
        && (tier === null || item.tier === tier);
    });
    const sort = sortFilter.value;
    matches.sort((a, b) => {
      if (sort === 'tier-asc') return a.tier - b.tier || a.name.localeCompare(b.name);
      if (sort === 'tier-desc') return b.tier - a.tier || a.name.localeCompare(b.name);
      if (sort === 'price-asc') return a.price - b.price || a.name.localeCompare(b.name);
      if (sort === 'price-desc') return b.price - a.price || a.name.localeCompare(b.name);
      if (sort === 'atk-desc') return b.atk - a.atk || b.tier - a.tier;
      return a.name.localeCompare(b.name) || a.tier - b.tier;
    });
    root.replaceChildren();
    count.textContent = `${matches.length.toLocaleString()} of ${items.length.toLocaleString()} items`;
    if (!matches.length) {
      root.append(make('div', 'empty-state', 'No items match those filters. Try clearing your search or choosing another slot or rarity.'));
      return;
    }
    const fragment = document.createDocumentFragment();
    for (const item of matches) fragment.append(renderCard(item));
    root.append(fragment);
  }

  const slots = [...new Set(items.map((item) => item.slot).filter(Boolean))].sort();
  const rarities = [...new Set(items.map((item) => item.rarity).filter(Boolean))];
  for (const slot of slots) slotFilter.add(new Option(titleCase(slot), slot));
  for (const rarity of rarities) rarityFilter.add(new Option(titleCase(rarity), rarity));
  [search, slotFilter, rarityFilter, tierFilter, sortFilter].forEach((el) => el.addEventListener(el === search || el === tierFilter ? 'input' : 'change', update));
  document.getElementById('reset-filters').addEventListener('click', () => {
    search.value = ''; slotFilter.value = 'all'; rarityFilter.value = 'all'; tierFilter.value = ''; sortFilter.value = 'name'; update();
  });
  update();
})();
