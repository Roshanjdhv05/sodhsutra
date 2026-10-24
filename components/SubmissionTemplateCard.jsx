'use client';
import { useState } from 'react';
import { Icon } from './Icon';
import { copyText } from '@/lib/toast';

const TEMPLATE_TEXT = `Dear Editorial Team,

I am submitting my research paper for consideration for publication in your journal.

Paper Details
- Paper Title: [Paper Title]
- Abstract: [Abstract]
- Research Category: [Selected Category]
- Keywords: [Keywords]

Corresponding Author
- Name: [Author Name]
- Email: [Author Email]
- Institution: [Institution Name]

Additional Authors: [Names and affiliations of co-authors, if applicable]

Manuscript: The complete research paper is attached as a PDF.

I confirm that the information provided is accurate and that all listed authors have approved this submission. I understand that submission does not guarantee acceptance or publication.

Please confirm receipt of this manuscript and advise me of any further requirements.

Kind regards,  
[Corresponding Author Name]`;

export default function SubmissionTemplateCard() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyText(TEMPLATE_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  return (
    <div className="submission-template-card">
      <div className="submission-template-header">
        <div>
          <h4>Editorial Submission Letter Template</h4>
          <p className="submission-template-sub">Use this template when sending your manuscript and details to the editorial team.</p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={handleCopy} aria-label="Copy submission letter template">
          <Icon name={copied ? 'check' : 'copy'} size={16} />
          {copied ? 'Copied!' : 'Copy Template'}
        </button>
      </div>
      <div className="submission-template-body">
        <p>Dear Editorial Team,</p>
        <p>I am submitting my research paper for consideration for publication in your journal.</p>

        <p><strong>Paper Details</strong></p>
        <ul>
          <li><strong>Paper Title:</strong> [Paper Title]</li>
          <li><strong>Abstract:</strong> [Abstract]</li>
          <li><strong>Research Category:</strong> [Selected Category]</li>
          <li><strong>Keywords:</strong> [Keywords]</li>
        </ul>

        <p><strong>Corresponding Author</strong></p>
        <ul>
          <li><strong>Name:</strong> [Author Name]</li>
          <li><strong>Email:</strong> [Author Email]</li>
          <li><strong>Institution:</strong> [Institution Name]</li>
        </ul>

        <p><strong>Additional Authors:</strong> [Names and affiliations of co-authors, if applicable]</p>

        <p><strong>Manuscript:</strong> The complete research paper is attached as a PDF.</p>

        <p>I confirm that the information provided is accurate and that all listed authors have approved this submission. I understand that submission does not guarantee acceptance or publication.</p>

        <p>Please confirm receipt of this manuscript and advise me of any further requirements.</p>

        <p>
          Kind regards,<br />
          [Corresponding Author Name]
        </p>
      </div>
    </div>
  );
}
