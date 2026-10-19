import StaticPage, { Ph } from '@/components/StaticPage';

export const metadata = { title: 'Editorial policies' };

export default function EditorialPolicy() {
  return (
    <StaticPage eyebrow="Policies" title="Editorial policies" intro="Draft policies that describe how a live platform would operate. None of these have been finalised." crumb="Editorial policies" secs={[
      { id: 'independence', title: 'Editorial independence', body: <p>Editorial decisions should be based on scholarly merit and fit with scope. <Ph /></p> },
      { id: 'review', title: 'Review process', body: <p>The review model (for example single-blind or open) has not been established. No peer-review status is displayed for any paper until it is verified. <Ph /></p> },
      { id: 'plagiarism', title: 'Plagiarism and originality', body: <p>Submissions must be original and properly attributed. A screening process will be defined before launch. <Ph /></p> },
      { id: 'corrections', title: 'Corrections and retractions', body: <p>Errors that affect interpretation should be corrected with a visible notice; serious problems may lead to retraction. <Ph /></p> },
      { id: 'privacy', title: 'Privacy practices', body: <p>Submissions and contact messages are stored in the site’s database and used only for editorial correspondence. Reader sign-in details stay in your browser. A full privacy policy is still to be written. <Ph /></p> },
      { id: 'terms', title: 'Terms of use', body: <p>Terms for authors and readers, including licensing and copyright, are to be written. <Ph /></p> },
    ]} />
  );
}
