import Link from 'next/link';
import StaticPage from '@/components/StaticPage';

export const metadata = {
  title: 'Submission Guidelines',
  description: 'General guidelines for authors, manuscript structure, and formatting requirements for submitting to ShodhSutra.',
};

export default function Guidelines() {
  return (
    <StaticPage
      eyebrow="Authors"
      title="Submission Guidelines"
      intro="Please review the author guidelines, manuscript structure, and formatting checklist before submitting your research paper."
      crumb="Submission Guidelines"
      secs={[
        {
          id: 'general-guidelines',
          title: '1. General Guidelines for Authors',
          body: (
            <ol className="submit-guidelines-ordered-list">
              <li>The manuscript must be original, academically sound, and relevant to the journal&apos;s aims and scope.</li>
              <li>The manuscript must not have been published previously in substantially the same form.</li>
              <li>The manuscript must not be under consideration by another journal at the same time, unless the journal&apos;s policy explicitly permits an exception.</li>
              <li>Authors must ensure that the research is based on reliable sources, appropriate methodology, and valid analysis.</li>
              <li>All authors must have made a genuine scholarly contribution to the research and must approve the final manuscript.</li>
              <li>The manuscript must be written in clear, grammatically correct academic language.</li>
              <li>Authors must follow the journal&apos;s prescribed template, reference style, word limit, and submission requirements.</li>
              <li>All sources, including text, ideas, data, figures, tables, and other materials obtained from third parties, must be properly acknowledged.</li>
              <li>Authors must disclose relevant conflicts of interest, funding sources, and any required ethical approvals.</li>
              <li>Submission does not guarantee acceptance or publication. All manuscripts are subject to editorial screening and the journal&apos;s peer-review process.</li>
            </ol>
          ),
        },
        {
          id: 'manuscript-structure',
          title: '2. Manuscript Structure and Formatting',
          body: (
            <>
              <p>Authors should arrange the manuscript in the following order.</p>
              <ol className="submit-guidelines-ordered-list">
                <li>
                  <strong>Title of the paper:</strong> A concise, specific title that reflects the subject, research problem, and main focus of the study.
                </li>
                <li>
                  <strong>Author details:</strong> Full names, institutional affiliations, department, institution, country, and corresponding author&apos;s email address. Follow the journal&apos;s anonymization requirements.
                </li>
                <li>
                  <strong>Abstract and keywords:</strong> Summarize the research problem, objective, methodology, principal results, and conclusion. Add the required number of keywords.
                </li>
                <li>
                  <strong>Main body of the paper:</strong> Introduction, literature review, research gap, objectives or research questions, methodology, results, discussion, and conclusion, as applicable to the research design.
                </li>
                <li>
                  <strong>Supporting material:</strong> Tables, figures, diagrams, equations, appendices, supplementary datasets, and code where relevant.
                </li>
                <li>
                  <strong>References and declarations:</strong> Complete references and applicable statements on funding, conflicts of interest, ethics approval, author contributions, data availability, and acknowledgements.
                </li>
              </ol>
            </>
          ),
        },
        {
          id: 'formatting-checklist',
          title: 'Recommended Formatting Checklist',
          body: (
            <>
              <p>The following values are illustrative defaults, not universal requirements.</p>
              <div className="submit-checklist-wrap" style={{ margin: '16px 0 28px' }}>
                <table className="submit-checklist-table">
                  <thead>
                    <tr>
                      <th scope="col">Element</th>
                      <th scope="col">Suggested Default</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>File format</td>
                      <td>.DOCX</td>
                    </tr>
                    <tr>
                      <td>Page size</td>
                      <td>A4</td>
                    </tr>
                    <tr>
                      <td>Font</td>
                      <td>Times New Roman</td>
                    </tr>
                    <tr>
                      <td>Main text size</td>
                      <td>12 pt</td>
                    </tr>
                    <tr>
                      <td>Line spacing</td>
                      <td>1.15</td>
                    </tr>
                    <tr>
                      <td>Margins</td>
                      <td>1 inch</td>
                    </tr>
                    <tr>
                      <td>Abstract</td>
                      <td>Approximately 150–250 words</td>
                    </tr>
                    <tr>
                      <td>Keywords</td>
                      <td>4–6</td>
                    </tr>
                    <tr>
                      <td>Headings</td>
                      <td>Consistent numbered</td>
                    </tr>
                    <tr>
                      <td>Tables and figures</td>
                      <td>Numbered, titled, readable, and cited in the text</td>
                    </tr>
                    <tr>
                      <td>References</td>
                      <td>One consistent prescribed style, such as APA or IEEE</td>
                    </tr>
                    <tr>
                      <td>File naming</td>
                      <td>Clear manuscript title</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                Ready to submit? Head over to the <Link href="/submit" style={{ color: 'var(--o)', fontWeight: 600 }}>Paper Submission Form</Link> to upload your manuscript.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
