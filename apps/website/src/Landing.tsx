import React from "react";
import { useState } from "react";
import strings from "./i18n/strings";
import * as assets from "./assets";

export default function Landing() {
  const [email, setEmail] = useState("");
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/70 bg-neutral-900/60 border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={assets.brand.PoliveraiLogo} alt="Poliver AI" className="h-8 w-auto" />
            <span className="font-semibold">{strings.header.brand}</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#about" className="hover:text-white/90">{strings.header.nav.about}</a>
            <a href="#how" className="hover:text-white/90">{strings.header.nav.how}</a>
            <a href="#plans" className="hover:text-white/90">{strings.header.nav.plans}</a>
            <a href="#cta" className="hover:text-white/90">{strings.header.nav.cta}</a>
          </nav>
          <a href="#cta" className="md:inline-flex hidden rounded-xl px-4 py-2 bg-white text-neutral-900 font-medium hover:opacity-90">{strings.header.launch}</a>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_50%_-200px,rgba(34,197,94,0.15),transparent)]" />
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-semibold leading-tight">
              {strings.hero.titleMain}
              <span className="block text-white/70">{strings.hero.titleSub}</span>
            </h1>
            <p className="mt-6 text-white/70 max-w-prose">{strings.hero.paragraph}</p>
            <form className="mt-8 flex gap-2" onSubmit={(e)=>e.preventDefault()}>
              <input
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                placeholder={strings.hero.placeholder}
                className="flex-1 rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-3 outline-none focus:border-emerald-400/60"
              />
              <a href="/webapp" className="rounded-xl px-5 py-3 bg-emerald-400 text-neutral-900 font-semibold hover:opacity-90">{strings.hero.tryIt}</a>
            </form>
            <div className="mt-3 text-xs text-white/50">{strings.hero.noCard}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {strings.cards.map((c, i) => (
              <IllustrationCard key={i} title={c.title} subtitle={c.subtitle} />
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="border-t border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-8">
          {strings.features.map((f, i) => (
            <Feature key={i} icon={f.icon} title={f.title} text={f.text} />
          ))}
        </div>
      </section>

      <section id="how" className="border-t border-neutral-800 bg-neutral-900/40">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-semibold">{strings.how.title}</h2>
          <ol className="mt-8 grid md:grid-cols-4 gap-6 text-sm">
            {strings.how.steps.map((s) => (
              <Step key={s.n} n={s.n} title={s.title} text={s.text} />
            ))}
          </ol>
        </div>
      </section>

      <section id="plans" className="border-t border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-semibold">{strings.plans.title}</h2>
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {strings.plans.items.map((p, i) => (
              <PlanCard key={i} name={p.name} price={p.price} tagline={p.tagline} features={p.features} featured={p.featured} />
            ))}
          </div>
        </div>
      </section>

      <section id="cta" className="border-t border-neutral-800 bg-neutral-900/40">
        <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-2xl font-semibold">{strings.cta.title}</h3>
            <p className="mt-3 text-white/70">{strings.cta.subtitle}</p>
            <div className="mt-6 flex gap-3">
              <a href="/webapp" className="rounded-xl px-5 py-3 bg-white text-neutral-900 font-semibold hover:opacity-90">{strings.cta.openWebApp}</a>
              <a href="#" className="rounded-xl px-5 py-3 bg-neutral-800 border border-neutral-700 hover:bg-neutral-800/80">{strings.cta.viewDemo}</a>
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <div className="text-sm text-white/70">{strings.demo.quickDemo}</div>
            <div className="mt-4 border-2 border-dashed border-neutral-700 rounded-xl p-8 text-center">
              <div className="text-5xl">📄</div>
              <div className="mt-2 text-white/80 font-medium">{strings.demo.dropHint}</div>
              <div className="text-xs text-white/50">{strings.demo.accepted}</div>
            </div>
            <button className="mt-6 w-full rounded-xl px-5 py-3 bg-emerald-400 text-neutral-900 font-semibold hover:opacity-90">{strings.demo.runCheck}</button>
            <div className="mt-3 text-xs text-white/50">{strings.demo.stripe}</div>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 py-10 text-sm text-white/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>{strings.footer.copyright(new Date().getFullYear())}</div>
          <div className="flex gap-4">
            {strings.footer.links.map((l, i) => (
              <a key={i} href="#" className="hover:text-white/80">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

function IllustrationCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <div className="h-28 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 grid place-items-center text-5xl">🧩</div>
      <div className="mt-4 font-medium">{title}</div>
      <div className="text-xs text-white/50">{subtitle}</div>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
      <div className="text-3xl">{icon}</div>
      <div className="mt-3 font-semibold">{title}</div>
      <div className="mt-1 text-white/70 text-sm">{text}</div>
    </div>
  );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <li className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-emerald-400 text-neutral-900 grid place-items-center font-bold">{n}</div>
        <div className="font-medium">{title}</div>
      </div>
      <p className="mt-2 text-white/70">{text}</p>
    </li>
  );
}

function PlanCard({ name, price, tagline, features, featured }: { name: string; price: string; tagline: string; features: string[]; featured?: boolean }) {
  return (
    <div className={`rounded-2xl border p-6 ${featured ? "border-emerald-400 shadow-[0_0_0_2px_rgba(52,211,153,0.2)]" : "border-neutral-800"} bg-neutral-900`}>
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-lg font-semibold">{name}</div>
          <div className="text-white/60 text-sm">{tagline}</div>
        </div>
        <div className="text-3xl font-bold">{price}</div>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-white/80">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2"><span className="mt-1">✔️</span><span>{f}</span></li>
        ))}
      </ul>
      <button className={`mt-6 w-full rounded-xl px-5 py-3 font-semibold ${featured ? "bg-emerald-400 text-neutral-900" : "bg-neutral-800"}`}>Choose {name}</button>
    </div>
  );
}
