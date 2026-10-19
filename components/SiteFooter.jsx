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
            <p>A modern, multidisciplinary home for research by students, teachers and independent researchers.</p>
            <div className="social">
              <a href="#" aria-label="X (Twitter)">X</a><a href="#" aria-label="LinkedIn">in</a><a href="#" aria-label="GitHub">Gh</a><a href="#" aria-label="YouTube">Yt</a>
            </div>
          </div>
          <div><h4>Explore</h4><ul>
            <li><Link href="/journals">Journals</Link></li><li><Link href="/categories">Categories</Link></li><li><Link href="/news">Research News</Link></li>
            <li><Link href="/student-research">Student Research</Link></li><li><Link href="/faculty-research">Faculty Research</Link></li></ul></div>
          <div><h4>Publish</h4><ul>
            <li><Link href="/submit">Submit Research</Link></li><li><Link href="/submission-guidelines">Submission Guidelines</Link></li><li><Link href="/editorial-policy">Editorial Policies</Link></li></ul></div>
          <div><h4>{brand}</h4><ul>
            <li><Link href="/about">About Us</Link></li><li><Link href="/contact">Contact</Link></li>
            <li><Link href="/editorial-policy#privacy">Privacy Policy</Link></li><li><Link href="/editorial-policy#terms">Terms</Link></li></ul></div>
        </div>
        <div className="foot-bottom">
          <p>© {year} {brand}. Sample papers, authors and news are fictional demonstration content.</p>
          <p>Not indexed, accredited or affiliated with any publisher.</p>
        </div>
      </div>
    </footer>
  );
}
