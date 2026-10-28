<script lang="ts">
  // Icônes au trait, dessinées en 24×24.
  const paths = {
    back: 'M15 5l-7 7 7 7',
    next: 'M9 5l7 7-7 7',
    down: 'M6 9l6 6 6-6',
    plus: 'M12 5v14M5 12h14',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    edit: 'M4 20h4L19 9l-4-4L4 16z',
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
    pin: 'M12 17v5M9 3h6l-1 7 4 3H6l4-3z',
    expand: 'M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7',
    download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
    folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z'
  };

  let { name, size = 18, stroke = 2.2 }: { name: keyof typeof paths | 'fan'; size?: number; stroke?: number } = $props();
  const maskId = $props.id();
</script>

{#if name === 'fan'}
  <!-- Éventail de cartes : celle du devant porte une coche découpée (récap des cartes finies). -->
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <defs>
      <mask id={maskId}>
        <rect width="24" height="24" fill="#fff" />
        <path d="M9.6 12.3l1.8 1.8 3.2-3.6" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </mask>
    </defs>
    <rect x="3" y="6" width="8.5" height="13" rx="1.8" fill="currentColor" opacity=".45" transform="rotate(-18 7.25 19)" />
    <rect x="12.5" y="6" width="8.5" height="13" rx="1.8" fill="currentColor" opacity=".45" transform="rotate(18 16.75 19)" />
    <rect x="7.75" y="4.5" width="8.5" height="14" rx="1.8" fill="currentColor" mask="url(#{maskId})" />
  </svg>
{:else}
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width={stroke}
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d={paths[name]} />
  </svg>
{/if}
