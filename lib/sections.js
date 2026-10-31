/** Builds the readable sections of a paper page.
 *  Only sections with actual content are included; unfilled sections are omitted. */
export function sectionsFor(p, h) {
  const secs = [];

  // 1. Full text sections (if filled)
  if (p.fullText && p.fullText.trim()) {
    const raw = p.fullText.trim();
    const headingRegex = /(?:^|\n)#{1,3}\s+([^\n]+)/g;
    const matches = [...raw.matchAll(headingRegex)];
    if (matches.length > 0) {
      matches.forEach((m, idx) => {
        const title = m[1].trim();
        const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const start = m.index + m[0].length;
        const end = idx + 1 < matches.length ? matches[idx + 1].index : raw.length;
        const sectionBody = raw.slice(start, end).trim();
        const paras = sectionBody.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
        if (paras.length > 0) {
          secs.push({ id, title, paras, body: sectionBody });
        }
      });
    } else {
      const paras = raw.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
      if (paras.length > 0) {
        secs.push({ id: 'full-text', title: 'Full text', paras, body: raw });
      }
    }
  } else if (p.demo) {
    // Demonstration seed record without custom fullText
    const k = p.keywords || [], c = h.cat(p.cat)?.name || '';
    const kw = (i) => k[i] || k[0] || 'the topic';
    const t = p.title.replace(/:.*/, '');
    const body = {
      'Introduction': [`This demonstration section sketches how a paper on ${kw(0)} might open. It places the topic within ${c.toLowerCase()}, names the problem the work addresses and explains why ${kw(1)} deserves closer attention.`, `The central question motivating this record is: “${t}”. The sections below show how such a question could be developed, evidenced and discussed.`],
      'Background': [`A short background would introduce ${kw(0)} and the setting in which ${kw(1)} matters, so that readers outside the immediate field can follow the case.`],
      'Scope and Approach': [`For a review of ${kw(0)}, this section would state the scope, the kinds of sources considered and how they were selected, so that readers can judge coverage and potential gaps.`],
      'Literature Review': [`A literature review would group existing work on ${kw(0)} and ${kw(2)} into themes, noting where findings agree, where they conflict and which questions remain open.`, 'Placeholder text: this demonstration record does not summarise real published studies.'],
      'Methodology': [`The methodology would describe the design, data sources and measures used to study ${kw(0)}, with enough detail that another group could repeat the approach.`, `Typical elements include how ${kw(3)} is operationalised, the sampling or simulation set-up, and the criteria used to judge outcomes.`],
      'Approach': [`This section would describe the approach taken to ${kw(0)}, including materials, set-up and practical constraints encountered along the way.`],
      'Results': [`A results section would present the main outcomes for ${kw(0)} in tables or figures and report them without interpretation. No real results exist in this demonstration record.`],
      'Observations': [`Observations would be reported here, noting what was measured, what was seen and what could not be determined about ${kw(0)}.`],
      'Central Argument': [`An essay on ${kw(0)} would develop its central argument in stages here, drawing on examples to show how ${kw(1)} shapes the question.`],
      'Counterpoints': ['This section would consider objections and alternative readings, and explain why the central argument still holds — or where it must be qualified.'],
      'Discussion': [`The discussion would interpret the findings on ${kw(0)}, connect them to earlier work and acknowledge limitations, including those related to ${kw(2)}.`],
      'Conclusion': [`The conclusion would summarise the contribution on ${kw(0)} and suggest directions for further work. Demonstration text only.`],
    };
    const plan = {
      emp: ['Introduction', 'Methodology', 'Results', 'Discussion', 'Conclusion'],
      rev: ['Introduction', 'Scope and Approach', 'Literature Review', 'Discussion', 'Conclusion'],
      ess: ['Introduction', 'Central Argument', 'Counterpoints', 'Conclusion'],
      cas: ['Background', 'Approach', 'Observations', 'Conclusion'],
    }[p.format] || ['Introduction', 'Discussion', 'Conclusion'];
    plan.forEach((s) => secs.push({ id: s.toLowerCase().replace(/\W+/g, '-'), title: s, paras: body[s] }));
  }

  // 2. References (only if filled and not already in secs)
  const validRefs = (p.refs || []).map((r) => String(r || '').trim()).filter(Boolean);
  if (validRefs.length > 0) {
    if (!secs.some((s) => s.id === 'references')) {
      secs.push({ id: 'references', title: 'References', refs: validRefs, paras: [] });
    }
  } else if (p.demo) {
    secs.push({
      id: 'references',
      title: 'References',
      refs: [],
      paras: ['No reference list is attached to this demonstration record. Verified references will appear here once real manuscripts are published.'],
    });
  }

  // 3. Original PDF Manuscript
  if (p.paperUrl) {
    secs.push({ id: 'manuscript-pdf', title: 'Original Manuscript (PDF)', paras: [], link: p.paperUrl });
  }

  return secs;
}

export function citeBase(p, h) {
  const names = p.authors.map((s) => { const w = h.author(s).name.split(' '); return `${w[w.length - 1]}, ${w[0][0]}.`; }).join(', ');
  const doi = p.doi ? `https://doi.org/${p.doi}` : 'no DOI assigned';
  return `${names} (${p.year}). ${p.title}. ShodhSutra${p.demo ? ' (demonstration record; ' + doi + ')' : ` (${doi})`}.`;
}
