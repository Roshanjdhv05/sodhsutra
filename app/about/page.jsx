import Link from 'next/link';
import StaticPage from '@/components/StaticPage';

export const metadata = {
  title: 'About ShodhSutra',
  description: 'A Multi Disciplinary Research Journal initiated to create a platform for young researchers, faculty, and scholars to showcase their research skills.',
  alternates: { canonical: 'https://shodhsutra.com/about' },
};

export default function About() {
  return (
    <StaticPage
      eyebrow="About"
      title="About ShodhSutra"
      intro="A Multi Disciplinary Research Journal initiated to create a platform for young researchers, faculty, and learners to showcase their research skills."
      crumb="About"
      secs={[
        {
          id: 'overview',
          title: 'Overview & Mission',
          body: (
            <>
              <p>
                A Multi Disciplinary Research Journal is initiated to create a platform for young researchers. The journal will have quarterly publication that supports faculty &amp; learners to showcase their research skills.
              </p>
              <p>
                Shodh Sutra is a journal providing a common platform for the exchange of knowledge, experiences, and research findings. It welcomes original research papers, review articles, case studies, conceptual papers, and interdisciplinary studies that contribute to the advancement of knowledge and society.
              </p>
            </>
          ),
        },
        {
          id: 'scope',
          title: 'Multidisciplinary Scope & Academic Areas',
          body: (
            <>
              <p>
                It is an academic platform that provides opportunities for researchers, academicians, scholars, students, and professionals from different fields of study to publish and share their original research, innovative ideas, and scholarly contributions. It encourages the integration of knowledge from various disciplines to address complex issues and develop innovative solutions to contemporary challenges.
              </p>
              <p>
                It promotes research, innovation, and intellectual collaboration across diverse academic areas, including Science, Technology, Engineering, Arts, Humanities, Social Sciences, Commerce, Management, Education, Agriculture, and other emerging fields.
              </p>
            </>
          ),
        },
        {
          id: 'quality',
          title: 'Academic Quality & Peer Review',
          body: (
            <p>
              It emphasizes academic quality, originality, research ethics, transparency, and a rigorous peer-review process to ensure the credibility and relevance of published work.
            </p>
          ),
        },
        {
          id: 'submissions',
          title: 'Submissions & Inquiries',
          body: (
            <p>
              We welcome submissions from researchers, academicians, and students. Please consult our <Link href="/submission-guidelines" style={{ color: 'var(--o)', fontWeight: 600 }}>Submission Guidelines</Link> and upload your manuscript via the <Link href="/submit" style={{ color: 'var(--o)', fontWeight: 600 }}>Paper Submission Form</Link>. For editorial inquiries, reach out through our <Link href="/contact" style={{ color: 'var(--o)', fontWeight: 600 }}>Contact Page</Link>.
            </p>
          ),
        },
      ]}
    />
  );
}
