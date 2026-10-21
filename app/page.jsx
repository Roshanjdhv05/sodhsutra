import Link from 'next/link';
import { getAll } from '@/lib/data';
import { makeHelpers } from '@/lib/helpers';
import { Icon } from '@/components/Icon';
import { Cover, PaperCard, NewsCard, AuthorCard, DemoNote, SetupNotice } from '@/components/ui';

export default async function Home() {
  const D = await getAll();
  if (D.error) return <SetupNotice error={D.error} />;
  const h = makeHelpers(D);
  const { papers: P, authors: AU, categories: CATS, news } = D;
  const feat = P.find((p) => p.featured) || [...P].sort(h.byDate)[0];
  const latest = [...P].sort(h.byDate).slice(0, 6);
  const popular = [...P].sort((a, b) => b.views - a.views).slice(0, 6);
  const students = [...P].filter((p) => p.authors[0] && h.author(p.authors[0]).type === 'student').sort(h.byDate).slice(0, 3);
  const faculty = [...P].filter((p) => h.hasType(p, 'faculty')).sort(h.byDate).slice(0, 5);
  const recentAuth = [...AU].sort((a, b) => b.seq - a.seq).slice(0, 6);
  const aiCat = CATS.find((c) => c.slug === 'ai-ml') || CATS[0];
  const aiPapers = P.filter((p) => aiCat && h.inCat(p, aiCat.slug)).slice(0, 3);
  const latestNews = [...news].sort(h.byDate).slice(0, 3);
  const hasDemo = P.some((p) => p.demo);

  if (!feat) {
    return (
      <div className="container section"><div className="empty"><h3>No research published yet</h3><p>Add papers from the <Link href="/admin">admin panel</Link> or run <code>supabase/seed.sql</code>.</p></div></div>
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
              <input id="hero-q" name="q" type="search" placeholder="Search research papers, authors, topics..." autoComplete="off" />
              <button className="btn btn-primary" type="submit">Search</button>
            </form>
            <div className="quick reveal"><span>Try:</span>
              <Link href="/search?q=language+models">language models</Link><Link href="/search?q=solar">solar</Link><Link href="/search?q=health">health</Link><Link href="/search?q=accessibility">accessibility</Link>
            </div>
            <div className="hero-cta reveal">
              <Link className="btn btn-primary" href="/published-papers">Explore Published Papers <Icon name="arrow" size={18} /></Link>
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

      <section className="section"><div className="container">
        <div className="section-head reveal"><div><p className="eyebrow">Fresh from the collection</p><h2>Latest Research</h2></div><Link className="more" href="/published-papers">View all papers <Icon name="arrow" size={16} /></Link></div>
        <div className="grid g3">{latest.map((p) => <PaperCard key={p.id} p={p} h={h} />)}</div>
        {hasDemo ? <DemoNote /> : null}
      </div></section>

      <section className="section tint"><div className="container">
        <div className="section-head reveal"><div><p className="eyebrow">Readership</p><h2>Most Read Research</h2><p className="sub">View counts are sample demonstration metrics.</p></div><Link className="more" href="/published-papers?sort=read">View All <Icon name="arrow" size={16} /></Link></div>
        <ol className="pop-list">
          {popular.map((p, i) => (
            <li className="pop-item reveal" key={p.id}>
              <span className="pop-rank">{String(i + 1).padStart(2, '0')}</span>
              <Link className="pop-cover" href={`/journals/${p.slug}`} tabIndex={-1} aria-hidden="true"><Cover p={p} h={h} cls="mini" /></Link>
              <div className="pop-text"><span className="chip">{h.cat(p.cat).short}</span><h3><Link href={`/journals/${p.slug}`}>{p.title}</Link></h3><p>{h.authorNames(p)}</p></div>
              <div className="pop-views"><Icon name="eye" size={16} /><strong>{h.num(p.views)}</strong><small>views</small></div>
            </li>
          ))}
        </ol>
      </div></section>

      <section className="section"><div className="container">
        <div className="section-head reveal"><div><p className="eyebrow">Editorial · not peer-reviewed research</p><h2>Research News</h2></div><Link className="more" href="/news">All news <Icon name="arrow" size={16} /></Link></div>
        <div className="grid g3">{latestNews.map((n) => <NewsCard key={n.id} n={n} h={h} />)}</div>
        <p className="demo-note"><Icon name="info" size={16} /> News items are editorial pieces, distinct from research papers. Sample items do not report real discoveries.</p>
      </div></section>

      <section className="section tint"><div className="container">
        <div className="section-head reveal"><div><p className="eyebrow">The next generation</p><h2>Student Research</h2><p className="sub">Work from undergraduate and postgraduate researchers.</p></div><Link className="more" href="/student-research">View All Student Research <Icon name="arrow" size={16} /></Link></div>
        <div className="grid g3">{students.map((p) => <PaperCard key={p.id} p={p} h={h} byline={`${h.author(p.authors[0]).name} · ${h.author(p.authors[0]).designation}`} />)}</div>
      </div></section>

      <section className="section"><div className="container">
        <div className="section-head reveal"><div><p className="eyebrow">From the academy</p><h2>Faculty &amp; Teacher Research</h2></div><Link className="more" href="/faculty-research">View All Faculty Research <Icon name="arrow" size={16} /></Link></div>
        <div className="frows">
          {faculty.map((p) => {
            const a = h.author(p.authors.find((s) => h.author(s).type === 'faculty'));
            return (
              <Link className="frow reveal" href={`/journals/${p.slug}`} key={p.id}>
                <time dateTime={p.date}>{h.fmt(p.date)}</time>
                <div><h3>{p.title}</h3><p><strong>{a.name}</strong>, {a.designation} · {a.inst}</p></div>
                <span className="chip">{h.cat(p.cat).short}</span><Icon name="arrow" size={20} />
              </Link>
            );
          })}
        </div>
      </div></section>

      <section className="section tint"><div className="container">
        <div className="section-head reveal"><div><p className="eyebrow">Browse by discipline</p><h2>Explore Research Categories</h2></div><Link className="more" href="/published-papers">All papers <Icon name="arrow" size={16} /></Link></div>
        <div className="cat-grid">
          {CATS.map((c) => (
            <Link className="cat-tile reveal" href={`/published-papers?cat=${c.slug}`} key={c.slug}>
              <span className="cat-ic"><Icon name={c.icon} size={26} /></span><h3>{c.name}</h3>
              <span className="cat-count">{P.filter((p) => h.inCat(p, c.slug)).length} papers</span><span className="cat-arrow"><Icon name="arrow" size={18} /></span>
            </Link>
          ))}
        </div>
      </div></section>

      {aiPapers.length ? (
        <section className="fj"><div className="container fj-grid">
          <div className="fj-cover reveal"><Cover p={aiPapers[0]} h={h} cls="xl" /></div>
          <div className="fj-copy reveal">
            <p className="eyebrow light">Featured collection</p>
            <h2>Machine Intelligence &amp; Society</h2>
            <p>A research collection gathering work on language models, evaluation and the practical questions of deploying learning systems — from classrooms to crop fields.</p>
            <dl className="fj-meta">
              <div><dt>Discipline</dt><dd>{aiCat.name}</dd></div>
              <div><dt>Editor</dt><dd>Editor name — placeholder</dd></div>
              <div><dt>Papers</dt><dd>{P.filter((p) => h.inCat(p, aiCat.slug)).length} in this collection</dd></div>
            </dl>
            <ul className="fj-list">{aiPapers.map((p) => <li key={p.id}><Link href={`/journals/${p.slug}`}>{p.title}</Link></li>)}</ul>
            <Link className="btn btn-white" href={`/published-papers?cat=${aiCat.slug}`}>Explore Category <Icon name="arrow" size={18} /></Link>
          </div>
        </div></section>
      ) : null}

      <section className="section"><div className="container">
        <div className="section-head reveal"><div><p className="eyebrow">New voices</p><h2>Recently Added Authors</h2></div><Link className="more" href="/authors">All authors <Icon name="arrow" size={16} /></Link></div>
        <div className="grid g3">{recentAuth.map((a) => <AuthorCard key={a.slug} a={a} />)}</div>
      </div></section>

      <section className="cta"><div className="container cta-in reveal">
        <h2>Your research deserves to be discovered.</h2>
        <p>Share your findings with readers across disciplines. Every submission is reviewed by the editorial team before anything is published.</p>
        <div className="hero-cta"><Link className="btn btn-white" href="/published-papers">Explore Published Papers</Link><Link className="btn btn-outline-white" href="/submit">Submit Your Paper</Link></div>
      </div></section>
    </>
  );
}
