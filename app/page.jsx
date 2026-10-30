import Link from 'next/link';
import { getAll } from '@/lib/data';
import { makeHelpers } from '@/lib/helpers';
import { Icon } from '@/components/Icon';
import { LatestPaperCard, DemoNote, SetupNotice } from '@/components/ui';

export default async function Home() {
  const D = await getAll();
  if (D.error) return <SetupNotice error={D.error} />;
  const h = makeHelpers(D);
  const { papers: P, categories: CATS } = D;
  const feat = P.find((p) => p.featured) || [...P].sort(h.byDate)[0];
  const latest = [...P].sort(h.byDate).slice(0, 6);
  const hasDemo = P.some((p) => p.demo);

  if (!feat) {
    return (
      <div className="container section"><div className="empty"><h3>No research published yet</h3><p>Add articles from the <Link href="/admin">admin panel</Link> or run <code>supabase/seed.sql</code>.</p></div></div>
    );
  }

  return (
    <>
      <section className="hero">
        <div className="hero-bg" aria-hidden="true" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow reveal">Multidisciplinary research journal platform</p>
            <h1 className="reveal">Ideas that move <span className="hl">knowledge</span> forward.</h1>
            <p className="lede reveal">Discover and share research across disciplines — from machine learning to marine ecology — written by students, teachers and independent researchers.</p>
            <form className="search-box reveal" action="/search" role="search">
              <label className="sr" htmlFor="hero-q">Search</label><Icon name="search" />
              <input id="hero-q" name="q" type="search" placeholder="Search research articles, authors, topics..." autoComplete="off" />
              <button className="btn btn-primary" type="submit">Search</button>
            </form>
            <div className="quick reveal"><span>Try:</span>
              <Link href="/search?q=language+models">language models</Link><Link href="/search?q=solar">solar</Link><Link href="/search?q=health">health</Link><Link href="/search?q=accessibility">accessibility</Link>
            </div>
            <div className="hero-cta reveal">
              <Link className="btn btn-primary" href="/published-papers">Explore Articles <Icon name="arrow" size={18} /></Link>
              <Link className="btn btn-ghost" href="/submit">Submit Research</Link>
            </div>
          </div>
          <div className="hero-visual reveal">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Orbiting%20Globe%20and%20Books%20of%20Knowledge.png"
              alt="Orbiting Globe and Books of Knowledge"
              width={560}
              height={500}
              className="hero-floating-img"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
      </section>

      <section className="section section-latest"><div className="container">
        <div className="latest-head reveal"><h2>Latest Research</h2><Link className="more" href="/published-papers">View all articles <Icon name="arrow" size={16} /></Link></div>
        <div className="latest-grid">{latest.map((p) => <LatestPaperCard key={p.id} p={p} h={h} />)}</div>
      </div></section>

      <section className="section tint"><div className="container">
        <div className="section-head reveal"><div><p className="eyebrow">Browse by discipline</p><h2>Explore Research Categories</h2></div><Link className="more" href="/published-papers">All articles <Icon name="arrow" size={16} /></Link></div>
        <div className="cat-grid">
          {CATS.map((c) => (
            <Link className="cat-tile reveal" href={`/published-papers?cat=${c.slug}`} key={c.slug}>
              <span className="cat-ic"><Icon name={c.icon} size={26} /></span><h3>{c.name}</h3>
              <span className="cat-count">{P.filter((p) => h.inCat(p, c.slug)).length} articles</span><span className="cat-arrow"><Icon name="arrow" size={18} /></span>
            </Link>
          ))}
        </div>
      </div></section>
    </>
  );
}
