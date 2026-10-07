(() => {
  const C = globalThis.NarutoCore;
  function isVisible(el) {
    if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true' || el.closest('[hidden], [aria-hidden="true"], [inert]')) return false;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    for (let node = el; node instanceof Element; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0 || style.pointerEvents === 'none') return false;
    }
    return true;
  }
  function firstVisible(selector) { return Array.from(document.querySelectorAll(selector)).find(isVisible) ?? null; }
  const netflix = {
    id: 'netflix',
    read() {
      const videoId = location.pathname.match(/^\/watch\/(\d+)/)?.[1];
      if (!videoId) return null;
      const title = document.querySelector('.video-title h4, .player-status-main-title');
      const known = C.catalogEntry(globalThis.NarutoNetflixCatalog, videoId);
      const visibleSeries = C.identifySeries(title?.textContent);
      // The catalog identity works even when the player hides its title controls.
      const series = visibleSeries ?? known?.series;
      if (!series) return null;
      // Position belongs to the title's siblings, never the whole page or recommendations.
      let position = C.parsePosition(Array.from(title?.parentElement.children ?? []).filter(el => el !== title).map(el => el.textContent).join(' '));
      if (known) {
        // Wait for stale player metadata after a route change to catch up.
        if ((title && visibleSeries !== known.series) || (position && (position.season !== null && position.season !== known.season || ![known.episode, known.localEpisode].includes(position.episode)))) return null;
        if (!title && !Array.from(document.querySelectorAll('video')).some(v => v.readyState >= 1)) return null;
        position ??= { season:known.season, episode:known.localEpisode };
        return { series, position, route:location.pathname, absolute:known.episode, identification:'catalog', videoId };
      }
      // A missing season must never reuse an unlabelled offset across Netflix seasons.
      if (position?.season === null) position = null;
      return { series, position, route: location.pathname, absolute: null };
    },
    intro: () => firstVisible('[data-uia="player-skip-intro"]'),
    recap: () => firstVisible('[data-uia="player-skip-recap"]'),
    endNext: () => firstVisible('[data-uia*="next-episode-seamless-button"]'),
    fillerNext: () => firstVisible('[data-uia="control-next"], button[aria-label="Next Episode"], button[aria-label="Siguiente episodio"], button[aria-label="Siguiente capítulo"]'),
    targetRoute(state, target) {
      if (state.identification !== 'catalog' || target <= state.episode) return null;
      const id = C.catalogVideoId(globalThis.NarutoNetflixCatalog, state.series, target);
      return id ? `/watch/${id}` : null;
    },
    navigate: route => location.assign(route)
  };
  const crunchyroll = {
    id: 'crunchyroll',
    read() {
      if (!/\/watch\/[A-Z0-9]+/i.test(location.pathname)) return null;
      const info = document.querySelector('.erc-current-media-info');
      const titleLink = info?.querySelector('[data-t="show-title-link"]');
      const series = C.identifySeries(titleLink?.textContent);
      const position = C.parsePosition(info?.querySelector('h1.title')?.textContent);
      if (!series) return null;
      // Confirmed against E303 on the official Shippuden page, with this exact series ID.
      const seriesId = series === 'naruto-shippuden' ? 'GYQ4MW246' : 'GY9PJ5KWR';
      const knownAbsoluteSeries = new RegExp(`/series/${seriesId}(?:/|$)`).test(titleLink?.getAttribute('href') ?? '');
      const absolute = knownAbsoluteSeries && position?.season === null ? position.episode : null;
      return { series, position, route: location.pathname, absolute };
    },
    intro: () => firstVisible('button[aria-label="Skip Intro"], button[aria-label="Saltar intro"], button[aria-label="Saltar introducción"]'),
    recap: () => firstVisible('button[aria-label="Skip Recap"], button[aria-label="Saltar resumen"]'),
    endNext() {
      const credits = firstVisible('button[aria-label="Skip Credits"], button[aria-label="Saltar créditos"]');
      const video = document.querySelector('video');
      if (!credits && !video?.ended) return null;
      return firstVisible('button[data-testid="next-episode-button"], button[aria-label="Next Episode"], button[aria-label="Siguiente episodio"]');
    },
    fillerNext(state, target) {
      const container = document.querySelector('[data-t="next-episode"]');
      const pos = Array.from(container?.querySelectorAll('a[aria-label]') ?? []).map(el => C.parsePosition(el.getAttribute('aria-label'))).find(Boolean);
      // Reject stale or unexpected destinations instead of walking into another series.
      if (!pos || pos.episode !== state.position?.episode + 1 || state.episode + 1 > target) return null;
      const link = container.querySelector('a.title[href]');
      if (!link) return null;
      const url = new URL(link.getAttribute('href'), location.href);
      if (url.origin !== location.origin || !/\/watch\//.test(url.pathname)) return null;
      return isVisible(link) ? link : null;
    }
  };
  globalThis.NarutoAdapters = { netflix, crunchyroll, isVisible };
})();
