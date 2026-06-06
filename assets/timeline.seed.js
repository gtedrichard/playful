/* ============================================================================
   KEEPKASE — TIMELINE SEED DATA  (the published default)
   ----------------------------------------------------------------------------
   This is the timeline visitors see by default. The in-browser editor saves
   edits to localStorage so YOUR tinkering never affects visitors. When you're
   happy with a new state, click "Export" in edit mode to download a JSON file,
   then paste its contents into the object below (replace `nodes`) and re-upload
   the theme. That is how you "publish" a timeline change. See README.md.
   ----------------------------------------------------------------------------
   NODE  : { id, title, status:'done'|'in-progress'|'upcoming', date, description,
             depth:0|1, milestones:[], links:[], suggestedSplit?:[] }
   MILE  : { label, state:'done'|'active'|'pending' }
   LINK  : { label, url, kind:'video'|'discord'|'link'|'alpha'|'waitlist' }
   ids on milestones/links are optional — the engine fills them in.
   ========================================================================== */
window.KEEPKASE_TIMELINE_SEED = {
  version: 1,
  updated: '2026-06-06',
  nodes: [
    {
      id: 'concept',
      title: 'Concept & first insight',
      status: 'done',
      date: '2024-09',
      depth: 0,
      description: 'Started as a personal need — a sticker layout of clubs, brands, and projects worth keeping when the laptop changed. The insight: expression changes faster than devices, so protection and personality should come apart.',
      milestones: [
        { label: 'First sketch of a removable expression layer', state: 'done' },
        { label: 'Wrote the founding note: “change freely because nothing is lost”', state: 'done' }
      ],
      links: [
        { label: 'Origin story', url: 'https://youtube.com/watch?v=PLACEHOLDER_ORIGIN', kind: 'video' },
        { label: '#the-first-idea', url: 'https://discord.com/channels/PLACEHOLDER/ORIGIN', kind: 'discord' }
      ]
    },
    {
      id: 'early-prototypes',
      title: 'Early 3D-printed prototypes',
      status: 'done',
      date: '2024-11',
      depth: 0,
      description: 'First 3D-printed borders to test the basic idea — a hardshell frame that stays on the laptop. Rough, but enough to prove the case could hold something swappable.',
      milestones: [
        { label: 'First printed border that clipped on cleanly', state: 'done' },
        { label: 'Confirmed no adhesive needs to touch the MacBook', state: 'done' },
        { label: 'Hand-cut sheet mockup held in place', state: 'done' }
      ],
      links: [
        { label: 'Print log', url: 'https://discord.com/channels/PLACEHOLDER/PRINTS', kind: 'discord' }
      ]
    },
    {
      id: 'dual-sheet',
      title: 'Dual-sheet mechanism',
      status: 'done',
      date: '2025-01',
      depth: 0,
      description: 'Landed on the two-sheet sandwich: a layout sits between two thin clear sheets, held by the border. Stickers and flat memory items stay intact and removable, with nothing permanent.',
      milestones: [
        { label: 'Two-sheet sandwich holds a layout flat', state: 'done' },
        { label: 'Swap test: pull one layout, drop in the next', state: 'done' },
        { label: 'Retire test: a finished sheet lifts out clean as a keepsake', state: 'done' }
      ],
      links: [
        { label: 'Swap demo', url: 'https://youtube.com/watch?v=PLACEHOLDER_SWAP', kind: 'video' },
        { label: '#mechanism-feedback', url: 'https://discord.com/channels/PLACEHOLDER/MECH', kind: 'discord' }
      ]
    },
    {
      id: 'material-trials',
      title: 'Material trials — clear sheets',
      status: 'in-progress',
      date: '2025-04',
      depth: 0,
      description: 'Testing thin clear polycarbonate sheets for clarity, thinness, and how well they hold a layout flat without yellowing. Materials are still being explored — nothing locked yet.',
      milestones: [
        { label: 'Shortlist of clear sheet candidates', state: 'done' },
        { label: 'Clarity and thinness comparison', state: 'active' },
        { label: 'Long-term yellowing / wear check', state: 'pending' }
      ],
      links: [
        { label: '#material-trials', url: 'https://discord.com/channels/PLACEHOLDER/MATERIAL', kind: 'discord' }
      ]
    },
    {
      id: 'border-fit',
      title: 'Border fit across models',
      status: 'in-progress',
      date: '2025-06',
      depth: 0,
      description: 'Dialing in the hardshell border so it sits flush and thin across current MacBook models, keeping protection at parity with a normal case — not bulky, not rugged.',
      milestones: [
        { label: 'Port and vent cutouts aligned', state: 'done' },
        { label: 'Flush fit on first target model', state: 'active' },
        { label: 'Fit confirmed across the model lineup', state: 'pending' }
      ],
      links: [
        { label: '#fit-and-models', url: 'https://discord.com/channels/PLACEHOLDER/FIT', kind: 'discord' }
      ]
    },
    {
      id: 'packaging-design',
      title: 'Packaging design',
      status: 'in-progress',
      date: '2025-08',
      depth: 0,
      description: 'Designing packaging that protects the case in transit and reads as something worth keeping. This node is large — try the Split button in edit mode to break it into focused sub-steps.',
      milestones: [
        { label: 'First packaging concept drafted', state: 'done' },
        { label: 'Recyclable cardboard supplier shortlisted', state: 'pending' },
        { label: 'Dieline approved and print-proofed', state: 'pending' }
      ],
      links: [
        { label: 'Packaging concepts', url: 'https://discord.com/channels/PLACEHOLDER/PACKAGING', kind: 'discord' }
      ],
      suggestedSplit: [
        { title: 'Find a recyclable cardboard supplier', status: 'in-progress', description: 'Source a recyclable cardboard supplier that can hit our run size before the box design is locked.' },
        { title: 'Final dieline & print test', status: 'upcoming', description: 'Lock the box dieline and run a physical print proof before manufacturing.' }
      ]
    },
    {
      id: 'alpha-open',
      title: 'Open 100 alpha spots',
      status: 'upcoming',
      date: '2025-10',
      depth: 0,
      description: 'Open the 100-person Alpha. Units at cost — $50 — so buyers help fund and shape the build. Members are named in product credits and join the Discord with first pick of colorways.',
      milestones: [
        { label: 'Alpha page and checkout ready', state: 'pending' },
        { label: 'First 100 spots live', state: 'pending' },
        { label: 'Colorway picks opened to members', state: 'pending' }
      ],
      links: [
        { label: 'Join the Alpha', url: '/products/keepkase-alpha', kind: 'alpha' },
        { label: '#welcome-alpha', url: 'https://discord.com/channels/PLACEHOLDER/ALPHA', kind: 'discord' }
      ]
    },
    {
      id: 'alpha-feedback-1',
      title: 'Alpha feedback — wave 1',
      status: 'upcoming',
      date: '2025-12',
      depth: 0,
      description: 'First round of real-world use from Alpha members. The build stays in the open — members vote on decisions and flag what to fix before scaling up.',
      milestones: [
        { label: 'First units in members’ hands', state: 'pending' },
        { label: 'Structured feedback round collected', state: 'pending' },
        { label: 'Top changes voted and queued', state: 'pending' }
      ],
      links: [
        { label: '#feedback-wave-1', url: 'https://discord.com/channels/PLACEHOLDER/WAVE1', kind: 'discord' }
      ]
    },
    {
      id: 'manufacturing-partner',
      title: 'Manufacturing partner',
      status: 'upcoming',
      date: '2026-02',
      depth: 0,
      description: 'Move from 3D-printed prototypes to a production partner who can hold the fit and finish at scale. Built in Berkeley, printed in Shenzhen.',
      milestones: [
        { label: 'Partner shortlist and quotes', state: 'pending' },
        { label: 'Sample run reviewed against spec', state: 'pending' },
        { label: 'Production partner selected', state: 'pending' }
      ],
      links: [
        { label: '#manufacturing-updates', url: 'https://discord.com/channels/PLACEHOLDER/MFG', kind: 'discord' }
      ]
    },
    {
      id: 'kickstarter-prep',
      title: 'Kickstarter prep',
      status: 'upcoming',
      date: '2026-04',
      depth: 0,
      description: 'Final stretch before launch — campaign page, pricing, and rewards. Alpha members keep 35–40% off the planned Kickstarter price and stay in the credits.',
      milestones: [
        { label: 'Campaign page drafted', state: 'pending' },
        { label: 'Reward tiers and pricing set', state: 'pending' },
        { label: 'Launch date locked', state: 'pending' }
      ],
      links: [
        { label: 'Free launch waitlist', url: '/pages/community', kind: 'waitlist' },
        { label: '#kickstarter-prep', url: 'https://discord.com/channels/PLACEHOLDER/KS', kind: 'discord' }
      ]
    }
  ]
};
