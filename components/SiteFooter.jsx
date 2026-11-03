import Link from 'next/link';
import { Logo } from './SiteHeader';

export default function SiteFooter({ brand }) {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="foot-grid">
          <div className="foot-brand">
            <Link className="brand" href="/"><Logo /><span>{brand}</span></Link>
            <p>A modern, multidisciplinary home for research by students, faculty, and scholars.</p>
          </div>
          <div>
            <h4>Explore</h4>
            <ul>
              <li><Link href="/published-papers">Articles</Link></li>
              <li><Link href="/journals">Issues</Link></li>
            </ul>
          </div>
          <div>
            <h4>Publish</h4>
            <ul>
              <li><Link href="/submit">Submit Research</Link></li>
              <li><Link href="/submission-guidelines">Submission Guidelines</Link></li>
            </ul>
          </div>
          <div>
            <h4>{brand}</h4>
            <ul>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li>
                <a href="https://mccmulund.ac.in" target="_blank" rel="noopener noreferrer">
                  Affiliated to mccmulund.ac.in
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <p>© {year} {brand}. All rights reserved.</p>
          <p>
            Developed by{' '}
            <a href="https://elevi8.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
              elevi8.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
