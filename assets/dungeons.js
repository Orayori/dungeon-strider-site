(() => {
  const codex = window.DS_CODEX || {};
  const monsters = codex.monsters || [];
  const settings = codex.settings || {};
  const floorInput = document.getElementById('floor-input');
  const result = document.getElementById('floor-result');
  const monsterRoot = document.getElementById('monster-list');
  const nf = (v) => Number(v || 0).toLocaleString();
  const pct = (v) => `${(Number(v || 0) * 100).toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;

  function el(tag, cls, txt) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (txt !== undefined) node.textContent = txt;
    return node;
  }

  function bossFloor(floor) {
    return floor > 0 && floor % (settings.bossEveryFloors || 10) === 0;
  }
  function seedFloor(floor) {
    let seed = Math.imul(Math.floor(floor), 2654435761) >>> 0;
    seed ^= seed >>> 15;
    seed = Math.imul(seed, 2246822519) >>> 0;
    return (seed ^ (seed >>> 13)) >>> 0;
  }
  function fits(monster, floor) {
    return floor >= (monster.minFloor ?? 1) && floor <= (monster.maxFloor ?? Infinity);
  }
  function pickMonster(floor) {
    if (!monsters.length) return null;
    const boss = bossFloor(floor);
    const pool = monsters.filter((m) => Boolean(m.boss) === boss && fits(m, floor));
    if (pool.length) return pool[seedFloor(floor) % pool.length];
    let best = null;
    for (const monster of monsters) {
      if (monster.boss || (monster.minFloor ?? 1) > floor) continue;
      if (!best || (monster.minFloor ?? 1) > (best.minFloor ?? 1)) best = monster;
    }
    return best || monsters[0];
  }
  function floorNumbers(floor) {
    const boss = bossFloor(floor);
    const monster = pickMonster(floor);
    const steps = Math.max(0, Math.floor(floor) - 1);
    const scale = boss ? (settings.bossStatMult || 2) : 1;
    const baseHp = monster?.hp ?? settings.baseMonsterHp ?? 30;
    const baseAtk = monster?.atk ?? settings.baseMonsterAtk ?? 8;
    const baseDef = monster?.def ?? settings.baseMonsterDef ?? 2;
    const hp = Math.round((baseHp + (settings.monsterHpPerFloor || 0) * steps) * scale);
    const atk = Math.round((baseAtk + (settings.monsterAtkPerFloor || 0) * steps) * scale);
    const def = Math.round((baseDef + (settings.monsterDefPerFloor || 0) * steps) * scale);
    const baseReward = monster?.scReward ?? settings.baseScReward ?? 25;
    const fullReward = Math.round(Math.max(0, baseReward + (settings.scRewardPerFloor || 0) * steps) * (boss ? (settings.bossScMult || 1) : 1));
    const replayReward = Math.max(1, Math.round(fullReward * (settings.replayScMult ?? 0.1)));
    return { boss, monster, hp, atk, def, fullReward, replayReward };
  }
  function renderFloor() {
    const floor = Math.min(999999, Math.max(1, Math.floor(Number(floorInput.value) || 1)));
    floorInput.value = String(floor);
    const f = floorNumbers(floor);
    result.replaceChildren();
    const panel = el('div', 'panel');
    const top = el('div', 'result-line');
    top.append(el('span', 'eyebrow', `FLOOR ${floor}`));
    top.append(el('span', `pill ${f.boss ? 'rarity-legendary' : ''}`, f.boss ? 'BOSS FLOOR' : 'DUNGEON ENCOUNTER'));
    panel.append(top);
    const name = el('h2', '', f.monster?.name || 'Dungeon encounter');
    name.style.marginTop = '0';
    panel.append(name);
    panel.append(el('p', 'muted', f.boss ? 'Boss stat and reward multipliers apply on this floor.' : 'Stats grow with each floor descended.'));
    const statGrid = el('div', 'stats');
    for (const [label, value] of [['HP', f.hp], ['ATK', f.atk], ['DEF', f.def], ['First-clear SC', f.fullReward]]) {
      const stat = el('div', 'stat'); stat.append(el('strong', '', nf(value))); stat.append(el('span', '', label)); statGrid.append(stat);
    }
    panel.append(statGrid);
    panel.append(el('p', 'muted', `Replay reward after this floor has already been cleared: approximately ${nf(f.replayReward)} SC. Actual rewards follow the device's saved deepest-floor progress.`));
    if (f.monster?.cardDropChance > 0) panel.append(el('p', 'muted', `Configured card drop chance: ${pct(f.monster.cardDropChance)}.`));
    result.append(panel);
  }

  function renderMonster(monster) {
    const card = el('article', 'monster-card');
    const art = el('div', 'monster-art-wrap');
    if (monster.sprite) {
      const img = el('img', 'monster-art'); img.src = monster.sprite; img.alt = `${monster.name} sprite`; img.loading = 'lazy'; art.append(img);
    } else art.append(el('span', 'muted', '?'));
    const info = el('div');
    const meta = el('div', 'item-meta');
    meta.append(el('span', `pill ${monster.boss ? 'rarity-legendary' : ''}`, monster.boss ? 'Boss' : 'Monster'));
    meta.append(el('span', 'pill', monster.maxFloor ? `Floors ${monster.minFloor}–${monster.maxFloor}` : `Floor ${monster.minFloor}+`));
    info.append(meta, el('h3', '', monster.name));
    info.append(el('p', '', `Base stats before floor scaling: HP ${nf(monster.hp)} · ATK ${nf(monster.atk)} · DEF ${nf(monster.def)}.`));
    const stats = el('div', 'monster-stats');
    stats.append(el('span', 'stat-chip', `${nf(monster.scReward)} base SC`));
    if (monster.cardDropChance > 0) stats.append(el('span', 'stat-chip', `${pct(monster.cardDropChance)} card chance`));
    info.append(stats);
    card.append(art, info);
    return card;
  }

  document.getElementById('calculate-floor').addEventListener('click', renderFloor);
  floorInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') renderFloor(); });
  floorInput.addEventListener('change', renderFloor);
  const monstersSorted = [...monsters].sort((a, b) => Number(a.minFloor || 1) - Number(b.minFloor || 1) || Number(a.boss) - Number(b.boss));
  if (monstersSorted.length) {
    const fragment = document.createDocumentFragment();
    for (const m of monstersSorted) fragment.append(renderMonster(m));
    monsterRoot.append(fragment);
  } else monsterRoot.append(el('div', 'empty-state', 'No monster definitions were found in the current content data.'));
  document.getElementById('item-count').textContent = `${(codex.items || []).length.toLocaleString()} equipment entries`;
  renderFloor();
})();
