import StaticPage, { Ph } from '@/components/StaticPage';

export const metadata = { title: 'Submission guidelines' };

export default function Guidelines() {
  return (
    <StaticPage eyebrow="Authors" title="Submission guidelines" intro="What to prepare before you submit a paper." crumb="Submission guidelines" secs={[
      { id: 'before', title: 'Before you submit', body: <ul><li>Confirm the work is original and unpublished elsewhere.</li><li>Gather author names, affiliations and emails.</li><li>Choose the best-fitting research category.</li><li>Upload your paper somewhere readable and copy its share link.</li></ul> },
      { id: 'format', title: 'Paper link and cover', body: <p>Paste a link that anyone can open (Google Drive, arXiv, OneDrive, your own site). Include an abstract of 50–300 words and 3–8 keywords. You may also add a cover image; it is automatically compressed to under 10 KB. Detailed formatting rules: <Ph /></p> },
      { id: 'process', title: 'After submission', body: <p>Submitting does not mean acceptance or publication. An editor reviews the link and contacts you by email.</p> },
      { id: 'ethics', title: 'Ethics and consent', body: <p>Authors must credit sources, disclose conflicts of interest and have consent for any personal data. <Ph /></p> },
    ]} />
  );
}
