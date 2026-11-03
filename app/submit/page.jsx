import { PageHead } from '@/components/ui';
import SubmissionTemplateCard from '@/components/SubmissionTemplateCard';
import SubmitForm from '@/components/SubmitForm';
import { getAll } from '@/lib/data';

export const metadata = {
  title: 'Submit Your Research Paper',
  description: 'Submit your original research paper, scholarly article, or review paper for editorial consideration in ShodhSutra.',
  alternates: { canonical: 'https://shodhsutra.in/submit' },
};

export default async function SubmitPage() {
  const data = await getAll();
  const categories = data?.categories || [];
  return (
    <>
      <PageHead
        eyebrow="Submit"
        title="Submit Your Research Paper"
        intro="We welcome original research papers, scholarly articles, review papers, and interdisciplinary studies that contribute meaningful insights to their respective fields."
        crumbs={[['Home', '/'], ['Submit Research']]}
      />

      <div className="submit-page-wrap">
        <div className="container narrow">

          {/* Intro */}
          <section className="submit-section">
            <p className="submit-intro-text">
              Researchers, academicians, students, and independent scholars are invited to submit their work for editorial consideration. Please review the author guidelines, manuscript structure, and formatting checklist below before submitting your paper.
            </p>
          </section>

          {/* 1. General Guidelines for Authors */}
          <section className="submit-section">
            <h2 className="submit-h2">1. General Guidelines for Authors</h2>
            <div className="submit-guidelines-list">
              <div className="submit-guideline-item">
                <span className="submit-guideline-num">1</span>
                <div>
                  <p>The manuscript must be original, academically sound, and relevant to the journal&apos;s aims and scope.</p>
                </div>
              </div>
              <div className="submit-guideline-item">
                <span className="submit-guideline-num">2</span>
                <div>
                  <p>The manuscript must not have been published previously in substantially the same form.</p>
                </div>
              </div>
              <div className="submit-guideline-item">
                <span className="submit-guideline-num">3</span>
                <div>
                  <p>The manuscript must not be under consideration by another journal at the same time, unless the journal&apos;s policy explicitly permits an exception.</p>
                </div>
              </div>
              <div className="submit-guideline-item">
                <span className="submit-guideline-num">4</span>
                <div>
                  <p>Authors must ensure that the research is based on reliable sources, appropriate methodology, and valid analysis.</p>
                </div>
              </div>
              <div className="submit-guideline-item">
                <span className="submit-guideline-num">5</span>
                <div>
                  <p>All authors must have made a genuine scholarly contribution to the research and must approve the final manuscript.</p>
                </div>
              </div>
              <div className="submit-guideline-item">
                <span className="submit-guideline-num">6</span>
                <div>
                  <p>The manuscript must be written in clear, grammatically correct academic language.</p>
                </div>
              </div>
              <div className="submit-guideline-item">
                <span className="submit-guideline-num">7</span>
                <div>
                  <p>Authors must follow the journal&apos;s prescribed template, reference style, word limit, and submission requirements.</p>
                </div>
              </div>
              <div className="submit-guideline-item">
                <span className="submit-guideline-num">8</span>
                <div>
                  <p>All sources, including text, ideas, data, figures, tables, and other materials obtained from third parties, must be properly acknowledged.</p>
                </div>
              </div>
              <div className="submit-guideline-item">
                <span className="submit-guideline-num">9</span>
                <div>
                  <p>Authors must disclose relevant conflicts of interest, funding sources, and any required ethical approvals.</p>
                </div>
              </div>
              <div className="submit-guideline-item">
                <span className="submit-guideline-num">10</span>
                <div>
                  <p>Submission does not guarantee acceptance or publication. All manuscripts are subject to editorial screening and the journal&apos;s peer-review process.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Manuscript Structure and Formatting */}
          <section className="submit-section">
            <h2 className="submit-h2">2. Manuscript Structure and Formatting</h2>
            <p className="submit-body-text">Authors should arrange the manuscript in the following order.</p>
            <div className="submit-guidelines-list">
              <div className="submit-guideline-item">
                <span className="submit-guideline-num">1</span>
                <div>
                  <h3 className="submit-guideline-title">Title of the Paper</h3>
                  <p>A concise, specific title that reflects the subject, research problem, and main focus of the study.</p>
                </div>
              </div>
              <div className="submit-guideline-item">
                <span className="submit-guideline-num">2</span>
                <div>
                  <h3 className="submit-guideline-title">Author Details</h3>
                  <p>Full names, institutional affiliations, department, institution, country, and corresponding author&apos;s email address. Follow the journal&apos;s anonymization requirements.</p>
                </div>
              </div>
              <div className="submit-guideline-item">
                <span className="submit-guideline-num">3</span>
                <div>
                  <h3 className="submit-guideline-title">Abstract and Keywords</h3>
                  <p>Summarize the research problem, objective, methodology, principal results, and conclusion. Add the required number of keywords.</p>
                </div>
              </div>
              <div className="submit-guideline-item">
                <span className="submit-guideline-num">4</span>
                <div>
                  <h3 className="submit-guideline-title">Main Body of the Paper</h3>
                  <p>Introduction, literature review, research gap, objectives or research questions, methodology, results, discussion, and conclusion, as applicable to the research design.</p>
                </div>
              </div>
              <div className="submit-guideline-item">
                <span className="submit-guideline-num">5</span>
                <div>
                  <h3 className="submit-guideline-title">Supporting Material</h3>
                  <p>Tables, figures, diagrams, equations, appendices, supplementary datasets, and code where relevant.</p>
                </div>
              </div>
              <div className="submit-guideline-item">
                <span className="submit-guideline-num">6</span>
                <div>
                  <h3 className="submit-guideline-title">References and Declarations</h3>
                  <p>Complete references and applicable statements on funding, conflicts of interest, ethics approval, author contributions, data availability, and acknowledgements.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Recommended Formatting Checklist */}
          <section className="submit-section">
            <h2 className="submit-h2">Recommended Formatting Checklist</h2>
            <p className="submit-body-text">The following values are illustrative defaults, not universal requirements.</p>
            <div className="submit-checklist-wrap">
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
          </section>

          {/* CTA + Template */}
          <section className="submit-section submit-cta-section">
            <div className="submit-cta-box">
              <div>
                <h3 className="submit-cta-title">Ready to submit?</h3>
                <p className="submit-cta-text">Complete all required fields, review your information carefully, and upload your final manuscript in PDF format. We look forward to considering your research contribution.</p>
              </div>
            </div>

            <SubmissionTemplateCard />
          </section>

          {/* Submission Form with Automatic PDF Compression */}
          <section className="submit-section submit-form-section" id="submission-form" style={{ marginTop: '32px' }}>
            <h2 className="submit-h2">Research Paper Submission Form</h2>
            <SubmitForm categories={categories} />
          </section>

        </div>
      </div>
    </>
  );
}
