import Link from 'next/link';
import StaticPage from '@/components/StaticPage';

export const metadata = {
  title: 'About ShodhSutra',
  description: 'A Multi Disciplinary Research Journal initiated to create a platform for young researchers, faculty, and scholars to showcase their research skills.',
  alternates: { canonical: 'https://shodhsutra.com/about' },
};

const PATRONS_LIST = [
  { name: 'CA Anil Ganu', role: 'President, Parle Tilak Vidyalaya Association' },
  { name: 'Adv. Vinay Jog', role: 'Vice President, Parle Tilak Vidyalaya Association' },
  { name: 'Shri Dilip Pethe', role: 'Hon. Secretary, Parle Tilak Vidyalaya Association' },
  { name: 'Shri Bansidhar Dhurandhar', role: 'Hon. Treasurer, Parle Tilak Vidyalaya Association' },
  { name: 'CA Mukund Chitale', role: 'Director, Parle Tilak Vidyalaya Association' },
  { name: 'CA Pramod Lele', role: 'Director, Parle Tilak Vidyalaya Association' },
];

const ADVISORY_BOARD_LIST = [
  { name: 'Prof. Dr. D. T. Shirke', role: 'Vice Chancellor, Warana University' },
  { name: 'Dr. Apoorva Palkar', role: 'Vice Chancellor, Ratan Tata Maharashtra State Skill University' },
  { name: 'Prof. Varadraj Bapat', role: 'Director, Shailesh J. Mehta School of Management, IIT Bombay' },
  { name: 'Shri Satish Marathe', role: 'Director, Reserve Bank of India (RBI)' },
  { name: 'Prof Dr Yashodhan Mithare', role: 'Dean, Faculty of Commerce & Management, H V Desai College, Pune' },
];

const EDITORIAL_MEMBERS_LIST = [
  { name: 'Prof. Dr. Kedar Marulkar', role: 'Head, Department of Commerce, Shivaji University, Kolhapur' },
  { name: 'CMA Dr. Kinnery Thakkar', role: 'Head, Department of Commerce, University of Mumbai' },
  { name: 'Dr. Swapnali Mahadik', role: "Assistant Professor, MCA, DES's NMITD" },
  { name: 'Dr. Arjun Lakhe', role: 'Associate Professor, Dept. Of Business Economics, MCC (Mumbai)' },
  { name: 'Dr. Kanchana Sattur', role: 'Assistant Professor, Dept. Of Management Studies, MCC (Mumbai)' },
  { name: 'Dr. Jyotika Chheda', role: 'Assistant Professor, Dept. Of Information Technology, MCC (Mumbai)' },
  { name: 'Dr. Shayeree Ghosh', role: 'Assistant Professor, Dept. Of English & Indian Languages, MCC (Mumbai)' },
  { name: 'Dr Sandhya Pandey', role: 'Assistant Professor, Dept. Of Information Technology, MCC (Mumbai)' },
];

const REVIEWER_COMMITTEE_LIST = [
  { name: 'CMA Dr. Kinnery Thakkar', role: 'Head, Department of Commerce, University of Mumbai' },
  { name: 'Prof. Dr. Kedar Marulkar', role: 'Head, Department of Commerce, Shivaji University' },
  { name: 'Dr. Swapnali Mahadik', role: "Assistant Professor, MCA, DES's NMITD" },
];

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
          id: 'patrons',
          title: 'Patrons',
          body: (
            <div className="vol-board-grid" style={{ marginTop: '12px', marginBottom: '16px' }}>
              {PATRONS_LIST.map((p, idx) => (
                <div key={idx} className="vol-person-item">
                  <div className="vol-person-name">{p.name}</div>
                  <div className="vol-person-role">{p.role}</div>
                </div>
              ))}
            </div>
          ),
        },
        {
          id: 'advisory-board',
          title: 'Advisory Board',
          body: (
            <div className="vol-board-grid" style={{ marginTop: '12px', marginBottom: '16px' }}>
              {ADVISORY_BOARD_LIST.map((p, idx) => (
                <div key={idx} className="vol-person-item">
                  <div className="vol-person-name">{p.name}</div>
                  <div className="vol-person-role">{p.role}</div>
                </div>
              ))}
            </div>
          ),
        },
        {
          id: 'editorial-board',
          title: 'Editorial Board',
          body: (
            <div style={{ marginTop: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                <div className="vol-key-person-box">
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--o6, #c2410c)' }}>
                    Editor-in-Chief
                  </span>
                  <div className="vol-person-name" style={{ fontSize: '1.02rem', marginTop: '4px' }}>
                    Prof. Dr. Minal Mapuskar
                  </div>
                  <div className="vol-person-role">Principal, Mulund College of Commerce (Autonomous)</div>
                </div>

                <div className="vol-key-person-box">
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--o6, #c2410c)' }}>
                    Managing Editor
                  </span>
                  <div className="vol-person-name" style={{ fontSize: '1.02rem', marginTop: '4px' }}>
                    Dr. Rajashri Deshpande
                  </div>
                  <div className="vol-person-role">Chairperson, Research Assessment, Promotion &amp; Ethics Committee</div>
                </div>
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px', color: 'var(--ink)' }}>Board Members</h3>
              <div className="vol-board-grid">
                {EDITORIAL_MEMBERS_LIST.map((p, idx) => (
                  <div key={idx} className="vol-person-item">
                    <div className="vol-person-name">{p.name}</div>
                    <div className="vol-person-role">{p.role}</div>
                  </div>
                ))}
              </div>
            </div>
          ),
        },
        {
          id: 'reviewer-committee',
          title: 'Reviewer Committee',
          body: (
            <div className="vol-board-grid" style={{ marginTop: '12px', marginBottom: '16px' }}>
              {REVIEWER_COMMITTEE_LIST.map((p, idx) => (
                <div key={idx} className="vol-person-item">
                  <div className="vol-person-name">{p.name}</div>
                  <div className="vol-person-role">{p.role}</div>
                </div>
              ))}
            </div>
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
