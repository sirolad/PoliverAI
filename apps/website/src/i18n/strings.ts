const strings = {
  header: {
    brand: "Poliver AI",
    nav: {
      about: "About",
      how: "How it works",
      plans: "Plans",
      cta: "Get started",
    },
    launch: "Launch App",
  },
  hero: {
    titleMain: "GDPR Policy Assistant",
    titleSub: "RAG-powered audit & rewrite",
    paragraph:
      "Upload your company policies. Our OpenAI‑powered RAG engine flags compliance gaps, suggests rewrites, and helps you publish a polished, auditable GDPR policy — fast.",
    placeholder: "Work email",
    tryIt: "Try it",
    noCard: "No credit card required to start",
  },
  cards: [
    { title: "Upload", subtitle: "PDF/DOCX" },
    { title: "Analyze", subtitle: "RAG + LLM" },
    { title: "Chat", subtitle: "Per‑section review" },
    { title: "Export", subtitle: "Locked until checkout" },
  ],
  features: [
    {
      icon: "📥",
      title: "Simple intake",
      text: "Drag‑and‑drop your current policy or start from our vetted GDPR templates.",
    },
    {
      icon: "🧭",
      title: "Guided review",
      text: "We iterate section by section, showing compliant vs. non‑compliant language and better phrasings.",
    },
    {
      icon: "🧾",
      title: "Versioned output",
      text: "Accept changes inline; we track diffs and assemble your final policy with one click.",
    },
  ],
  how: {
    title: "How it works",
    steps: [
      { n: 1, title: "Upload", text: "PDF/DOCX/TXT. We parse, chunk & embed into a private store." },
      { n: 2, title: "Assess", text: "Cross‑compare with GDPR knowledge base; flag issues & suggest rewrites." },
      { n: 3, title: "Review", text: "Chat per section, pick from examples, accept changes with versioning." },
      { n: 4, title: "Export", text: "Pay to unlock download; get signed PDF & DOCX with audit trail." },
    ],
  },
  plans: {
    title: "Plans",
    items: [
      {
        name: "Assess",
        price: "$39",
        tagline: "One‑off compliance check",
        features: ["Upload up to 50 pages", "Gap analysis", "Section chat (read‑only)", "Export preview"],
      },
      {
        name: "Rewrite",
        price: "$99",
        tagline: "Full audit & rewrite",
        featured: true,
        features: ["Everything in Assess", "Rewrite suggestions", "Accept/Reject diffs", "Locked export until checkout"],
      },
      {
        name: "Corporate",
        price: "$299/mo",
        tagline: "Unlimited docs & seats",
        features: ["Unlimited pages", "Team spaces", "API access", "Priority support"],
      },
    ],
  },
  cta: {
    title: "Ready to try the RAG GDPR assistant?",
    subtitle: "Start with a demo file or upload your own policy. No commitment required.",
    openWebApp: "Open Web App",
    viewDemo: "View Demo",
  },
  demo: {
    quickDemo: "Quick demo upload",
    dropHint: "Drop policy PDF here",
    accepted: ".pdf .docx .txt up to 10MB",
    runCheck: "Run GDPR Check",
    stripe: "Stripe test checkout to unlock exports",
  },
  footer: {
    copyright: (year: number) => `© ${year} AI Academy`,
    links: ["Privacy", "Terms", "Security"],
  },
}

export default strings
