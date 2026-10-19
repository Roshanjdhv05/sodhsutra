import Link from 'next/link';
import StaticPage, { Ph } from '@/components/StaticPage';

export const metadata = { title: 'About' };

export default function About() {
  return (
    <StaticPage eyebrow="About" title="About ShodhSutra" intro="A multidisciplinary research journal platform for students, teachers and independent researchers." crumb="About" secs={[
      { id: 'purpose', title: 'Our purpose', body: <><p>ShodhSutra helps students, teachers and independent researchers share work across disciplines and be read by a wider audience.</p><p>Some papers, authors and news items on this site are fictional demonstration content and are labelled as such.</p></> },
      { id: 'standards', title: 'Editorial standards', body: <><p>Standards for review, authorship and ethics are still being defined. <Ph /></p><p>ShodhSutra makes no claim of indexing, accreditation, impact factor or established peer-review arrangements.</p></> },
      { id: 'how', title: 'How it works', body: <ol><li>Authors submit a paper link and metadata.</li><li>Editors check scope and policy compliance.</li><li>Eligible work is reviewed under a process to be announced.</li><li>Accepted work is published with its own page and citation details.</li></ol> },
      { id: 'team', title: 'Team and contact', body: <p>Editorial team details to be added. <Ph /> See the <Link href="/contact">contact page</Link>.</p> },
    ]} />
  );
}
