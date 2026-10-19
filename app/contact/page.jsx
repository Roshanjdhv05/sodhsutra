import { PageHead, DemoNote } from '@/components/ui';
import { Icon } from '@/components/Icon';
import ContactForm from '@/components/ContactForm';

export const metadata = { title: 'Contact' };

export default function ContactPage() {
  return (
    <>
      <PageHead eyebrow="Contact" title="Get in touch" intro="Questions about submissions, corrections or partnerships." crumbs={[['Home', '/'], ['Contact']]} />
      <section className="section"><div className="container author-cols">
        <div>
          <h2>Contact details</h2>
          <ul className="clist">
            <li><Icon name="mail" size={18} /> <span>contact@shodhsutra.example <small>(placeholder address)</small></span></li>
            <li><Icon name="building" size={18} /> <span>Editorial office — address to be added</span></li>
            <li><Icon name="globe" size={18} /> <span>Response times to be confirmed</span></li>
          </ul>
          <DemoNote>Placeholder contact details. Replace them before launch.</DemoNote>
        </div>
        <div><h2>Send a message</h2><ContactForm /></div>
      </div></section>
    </>
  );
}
