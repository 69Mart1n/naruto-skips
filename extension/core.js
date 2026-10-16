(() => {
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  function identifySeries(value) {
    const text = normalize(value);
    if (/\bboruto\b/.test(text)) return null;
    if (/^naruto\s*[:：-]?\s*shipp[uū]den$/.test(text)) return 'naruto-shippuden';
    if (text === 'naruto') return 'naruto';
    if (text === 'one piece') return 'one-piece';
    if (text === 'bleach') return 'bleach';
    if (/^dragon\s*ball\s+z$/.test(text)) return 'dragon-ball-z';
    if (/^dragon\s*ball$/.test(text)) return 'dragon-ball';
    if (text === 'black clover') return 'black-clover';
    return null;
  }
  function parsePosition(value) {
    const text = normalize(value);
    const compact = text.match(/\b[st]\s*(\d+)\s*[:. -]?\s*e\s*(\d+)\b/);
    if (compact) return { season:Number(compact[1]), episode:Number(compact[2]) };
    const season = text.match(/(?:\b(?:s|t)\s*|\b(?:season|temporada)\s*)(\d+)\b/);
    const episode = text.match(/(?:\b(?:e|ep)\s*|\b(?:episode|episodio|capitulo)\s*[:.]?\s*)(\d+)\b/);
    if (!episode) return null;
    return { season: season ? Number(season[1]) : null, episode: Number(episode[1]) };
  }
  const inRanges = (number, ranges) => ranges.some(([start, end]) => number >= start && number <= end);
  function effectiveProfile(data, profile, series) {
    const record = data.profiles?.[profile];
    if (record?.fallback && data.series[series] && !Array.isArray(record.skipRanges?.[series])) return record.fallback;
    return profile;
  }
  function classify(data, series, episode) {
    const record = data.series[series];
    if (!record || !Number.isInteger(episode) || episode < 1 || episode > record.totalEpisodes) return null;
    if (inRanges(episode, record.fillerRanges)) return 'filler';
    if (inRanges(episode, record.mixedRanges)) return 'mixed';
    if (inRanges(episode, record.animeCanonRanges)) return 'anime-canon';
    return 'manga-canon';
  }
  function shouldSkip(data, series, episode, keep = [], profile = 'full-filler') {
    if (!classify(data, series, episode) || keep.includes(episode)) return false;
    profile = effectiveProfile(data, profile, series);
    if (profile === 'full-filler') return inRanges(episode, data.series[series].fillerRanges);
    const ranges = data.profiles?.[profile]?.skipRanges?.[series];
    return Array.isArray(ranges) && inRanges(episode, ranges);
  }
  function targetEpisode(data, series, episode, keep = [], profile = 'full-filler') {
    if (!classify(data, series, episode)) return null;
    let target = episode;
    while (shouldSkip(data, series, target, keep, profile)) target++;
    return classify(data, series, target) ? target : null;
  }
  // Season offsets are scoped to a platform, series and visible season. No inferred counters.
  function mappingKey(platform, series, season, scope) { return `${platform}:${series}:${season ?? 'unlabelled'}${scope ? `:${scope}` : ''}`; }
  function absoluteEpisode(platform, series, position, mappings, data, scope) {
    if (!position) return null;
    const offset = mappings[mappingKey(platform, series, position.season, scope)];
    if (!Number.isInteger(offset)) return null;
    const absolute = position.episode + offset;
    return classify(data, series, absolute) ? absolute : null;
  }
  function catalogEntry(catalog, videoId) {
    if (!/^\d+$/.test(String(videoId))) return null;
    for (const [series, record] of Object.entries(catalog?.series ?? {})) {
      for (const [first, last, id] of record.idRuns) {
        const episode = Number(videoId) - id + first;
        if (episode < first || episode > last) continue;
        let offset = 0;
        for (let i = 0; i < record.seasonLengths.length; i++) {
          if (episode <= offset + record.seasonLengths[i]) return { series, episode, season:i+1, localEpisode:episode-offset, videoId:String(videoId) };
          offset += record.seasonLengths[i];
        }
      }
    }
    return null;
  }
  function catalogVideoId(catalog, series, episode) {
    if (!Number.isInteger(episode)) return null;
    const run = catalog?.series?.[series]?.idRuns.find(([first,last]) => episode >= first && episode <= last);
    return run ? String(run[2]+episode-run[0]) : null;
  }
  globalThis.NarutoCore = { normalize, identifySeries, parsePosition, classify, effectiveProfile, shouldSkip, targetEpisode, mappingKey, absoluteEpisode, catalogEntry, catalogVideoId };
})();
