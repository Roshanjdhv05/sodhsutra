import { PageHead } from '@/components/ui';
import SubmissionTemplateCard from '@/components/SubmissionTemplateCard';
import SubmitForm from '@/components/SubmitForm';
import { getAll } from '@/lib/data';

export const metadata = {
  title: 'Submit Your Research Paper',
  description: 'Submit your original research paper, scholarly article, or review paper for editorial consideration in ShodhSutra.',
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
              Researchers, academicians, students, and independent scholars are invited to submit their work for editorial consideration. Please complete the submission form with accurate author information and upload your manuscript in PDF format. Ensure that your paper follows the recommended structure and includes appropriate citations and references.
            </p>
          </section>

          {/* Submission Guidelines */}
          <section className="submit-section">
            <h2 className="submit-h2">Submission Guidelines</h2>
            <div className="submit-guidelines-list">
              <div className="submit-guideline-item">
                <span className="submit-guideline-num">1</span>
                <div>
                  <h3 className="submit-guideline-title">Paper Title</h3>
                  <p>Provide a clear, concise, and descriptive title that accurately reflects the subject and scope of your research.</p>
                </div>
              </div>
              <div className="submit-guideline-item">
                <span className="submit-guideline-num">2</span>
                <div>
                  <h3 className="submit-guideline-title">Abstract <span className="submit-range">(50–300 words)</span></h3>
                  <p>Write a brief summary of your research, including its purpose, objectives, methodology, key findings, and conclusions. The abstract should allow readers to understand the significance of your work without reading the entire paper.</p>
                </div>
              </div>
              <div className="submit-guideline-item">
                <span className="submit-guideline-num">3</span>
                <div>
                  <h3 className="submit-guideline-title">Author Information</h3>
                  <p>Enter the corresponding author's full name and active email address. Add the names of all co-authors in the order they should appear in the publication. Provide the institution, university, organization, or independent affiliation associated with the research.</p>
                </div>
              </div>
              <div className="submit-guideline-item">
                <span className="submit-guideline-num">4</span>
                <div>
                  <h3 className="submit-guideline-title">Research Category</h3>
                  <p>Select the category that best represents your paper's primary subject area. This helps the editorial team classify submissions and direct them to appropriate reviewers.</p>
                </div>
              </div>
              <div className="submit-guideline-item">
                <span className="submit-guideline-num">5</span>
                <div>
                  <h3 className="submit-guideline-title">Keywords <span className="submit-range">(3–8 keywords)</span></h3>
                  <p>Provide three to eight relevant keywords, separated by commas. Choose specific terms that represent the main concepts, methods, and subject areas of your research.</p>
                </div>
              </div>
              <div className="submit-guideline-item">
                <span className="submit-guideline-num">6</span>
                <div>
                  <h3 className="submit-guideline-title">Manuscript Upload</h3>
                  <p>Upload your complete research paper in PDF format. Before submitting, ensure that the document contains all relevant sections, tables, figures, citations, and references, as applicable.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Recommended Paper Structure */}
          <section className="submit-section">
            <h2 className="submit-h2">Recommended Paper Structure</h2>
            <p className="submit-body-text">For consistency and ease of review, your manuscript should generally include the following sections, where applicable:</p>
            <ol className="submit-structure-list">
              <li><strong>Abstract:</strong> Summarizes the research objectives, methodology, findings, and conclusions.</li>
              <li><strong>Introduction:</strong> Establishes the research background, problem statement, objectives, and significance.</li>
              <li><strong>Scope and Approach:</strong> Explains the scope of the study, research questions, methods, and approach.</li>
              <li><strong>Literature Review:</strong> Discusses relevant previous research and identifies gaps the current study addresses.</li>
              <li><strong>Discussion:</strong> Interprets the findings, explains their implications, and compares them with existing research.</li>
              <li><strong>Conclusion:</strong> Summarizes the main findings, contributions, limitations, and possible directions for future research.</li>
              <li><strong>References:</strong> Lists all sources cited in the manuscript using a consistent referencing style.</li>
            </ol>
            <p className="submit-body-text submit-note">Additional sections, such as methodology, results, acknowledgements, funding disclosures, or conflict-of-interest statements, may be included when relevant to the nature of the research.</p>
          </section>

          {/* After Submission */}
          <section className="submit-section">
            <h2 className="submit-h2">What Happens After Submission?</h2>
            <div className="submit-process-steps">
              <div className="submit-process-step">
                <span className="submit-process-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </span>
                <div>
                  <h3>Confirmation</h3>
                  <p>After you submit, your manuscript and submission details will be sent to the journal's designated editorial email address. You should receive a confirmation once the submission has been successfully received, if email confirmation is enabled.</p>
                </div>
              </div>
              <div className="submit-process-step">
                <span className="submit-process-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="m18 2 4 4-10 10H8v-4z"/></svg>
                </span>
                <div>
                  <h3>Initial Assessment</h3>
                  <p>The editorial team may conduct an initial assessment to check the manuscript's relevance, completeness, originality, and compliance with the submission guidelines. Papers that meet the initial requirements may proceed to further editorial evaluation or peer review, depending on the journal's review policy.</p>
                </div>
              </div>
              <div className="submit-process-step">
                <span className="submit-process-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>
                </span>
                <div>
                  <h3>Follow-up</h3>
                  <p>Authors may be contacted if additional information, corrections, or revisions are required. Submission does not guarantee acceptance or publication.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Important Notes */}
          <section className="submit-section">
            <h2 className="submit-h2">Important Notes</h2>
            <ul className="submit-notes-list">
              <li>Submit original work that has been prepared in accordance with applicable research ethics and publication standards.</li>
              <li>Ensure that all listed authors have approved the submission and that the corresponding author is authorized to communicate on their behalf.</li>
              <li>Cite all external sources appropriately and disclose relevant conflicts of interest, funding, or ethical approvals where applicable.</li>
              <li>Do not submit plagiarized work or research containing fabricated or falsified data.</li>
              <li>Keep a copy of your manuscript and submission confirmation for your records.</li>
            </ul>
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
