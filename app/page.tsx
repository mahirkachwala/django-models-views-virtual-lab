'use client';

import {
  lazy,
  Suspense,
  useEffect,
  useState,
  type SyntheticEvent,
} from 'react';
import { ChevronRight, Menu, Send } from 'lucide-react';
import { Procedure, References, Theory } from '@/components/lab-lessons';
import Quiz from '@/components/lab-quiz';
import { DataTable } from '@/components/lab-common';
import { completeSection } from '@/lib/lab-progress';

const Experiment = lazy(() => import('@/components/lab-experiment'));

const sections = [
  'Aim',
  'Theory',
  'Pretest',
  'Procedure',
  'Simulation',
  'Posttest',
  'References',
  'Contributors',
  'Feedback',
] as const;
type Section = (typeof sections)[number];

const slugs: Record<Section, string> = {
  Aim: 'aim',
  Theory: 'theory',
  Pretest: 'pretest',
  Procedure: 'procedure',
  Simulation: 'simulation',
  Posttest: 'posttest',
  References: 'references',
  Contributors: 'contributors',
  Feedback: 'feedback',
};

function Aim() {
  useEffect(() => completeSection('Aim'), []);
  return (
    <div className="lesson aim-page">
      <p>
        To study the concept of <strong>Models and Views in Django</strong> and
        understand how Django models interact with the database and how views
        process HTTP requests and generate responses.
      </p>
      <h2>Learning Objectives</h2>
      <p>After completing this experiment, the learner will be able to:</p>
      <ul>
        <li>
          explain the role of models and views in Django&apos;s
          Model–Template–View architecture;
        </li>
        <li>identify model fields, primary keys and relationships;</li>
        <li>
          describe how migrations keep the database schema synchronized with
          models;
        </li>
        <li>use the Django ORM to retrieve and modify stored records;</li>
        <li>
          trace an HTTP request through a URL pattern, view, model, template and
          response;
        </li>
        <li>
          perform and observe Create, Read, Update and Delete operations; and
        </li>
        <li>interpret validation errors and missing-resource responses.</li>
      </ul>
      <h2>Prerequisites</h2>
      <ul>
        <li>Basic knowledge of Python classes and functions</li>
        <li>Basic understanding of database tables, rows and columns</li>
        <li>Familiarity with HTTP requests and responses</li>
      </ul>
    </div>
  );
}

function Contributors() {
  useEffect(() => completeSection('Contributors'), []);
  return (
    <div className="lesson contributors-page">
      <h2 className="underlined-heading">Subject Matter Experts</h2>
      <DataTable
        headers={['SNo.', 'Name', 'Email', 'Institute']}
        rows={[[1, 'Faculty Coordinator', 'To be supplied', 'To be supplied']]}
      />
      <h2 className="underlined-heading contributors-second">Developers</h2>
      <DataTable
        headers={['SNo.', 'Name', 'Email', 'Institute']}
        rows={[
          [
            1,
            <a
              key="owner"
              href="https://github.com/mahirkachwala"
              target="_blank"
              rel="noreferrer"
            >
              Mahir Kachwala
            </a>,
            <a key="owner-email" href="mailto:mahirahmed.k@somaiya.edu">
              mahirahmed.k@somaiya.edu
            </a>,
            'Somaiya Vidyavihar University',
          ],
          [
            2,
            <a
              key="contributor"
              href="https://github.com/arnavkadhe"
              target="_blank"
              rel="noreferrer"
            >
              Arnav Kadhe
            </a>,
            <a key="contributor-email" href="mailto:arnav.kadhe@somaiya.edu">
              arnav.kadhe@somaiya.edu
            </a>,
            'Somaiya Vidyavihar University',
          ],
        ]}
      />
      <p className="publication-note">
        Project owner: mahirkachwala. Contributor: arnavkadhe. Faculty reviewer
        details have not been supplied.
      </p>
    </div>
  );
}

function Feedback({ openedInitially = false }: { openedInitially?: boolean }) {
  const [open, setOpen] = useState(openedInitially);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const value = JSON.parse(
          localStorage.getItem('django-lab-feedback') || '{}',
        );
        setRating(value.rating || 0);
        setComment(value.comment || '');
      } catch {}
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rating) return;
    localStorage.setItem(
      'django-lab-feedback',
      JSON.stringify({
        rating,
        comment: comment.trim(),
        savedAt: new Date().toISOString(),
      }),
    );
    setSaved(true);
    completeSection('Feedback');
  }
  return (
    <div className="lesson feedback-page">
      <h2 className="underlined-heading feedback-heading">Feedback</h2>
      <p>
        <strong>Dear User,</strong>
      </p>
      <p>
        Thanks for using Virtual Labs. Your opinion is valuable to us. To help
        us improve, we&apos;d like to ask you a few questions about your
        experience. It will only take a few minutes and your answers will help
        us make Virtual Labs better for you and other users.
      </p>
      {!open && (
        <button
          className="outline-vlab-button share-button"
          type="button"
          onClick={() => setOpen(true)}
        >
          Share Your Experience
        </button>
      )}
      {open && (
        <form className="feedback-form" onSubmit={submit}>
          <fieldset>
            <legend>How useful was this experiment?</legend>
            <div className="rating-control">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  key={value}
                  aria-label={`${value} out of 5`}
                  aria-pressed={rating === value}
                  className={value <= rating ? 'filled' : ''}
                  onClick={() => {
                    setRating(value);
                    setSaved(false);
                  }}
                >
                  ★
                </button>
              ))}
            </div>
          </fieldset>
          <label>
            Comments
            <textarea
              value={comment}
              onChange={(event) => {
                setComment(event.target.value);
                setSaved(false);
              }}
              maxLength={1000}
              placeholder="Share your experience with this experiment"
            />
          </label>
          <button className="vlab-button" type="submit" disabled={!rating}>
            <Send /> Submit Feedback
          </button>
          {saved && (
            <p className="success-text" role="status">
              Thank you. Your feedback has been saved in this browser.
            </p>
          )}
        </form>
      )}
      <p className="feedback-thanks">
        Thanks for your time !<br />
        <strong>The Virtual Labs Team</strong>
      </p>
    </div>
  );
}

function VLabFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-columns">
        <div>
          <h3>Community Links</h3>
          <a href="https://sakshat.ac.in/" target="_blank" rel="noreferrer">
            Sakshat Portal
          </a>
          <a
            href="https://outreach.vlabs.ac.in/"
            target="_blank"
            rel="noreferrer"
          >
            Outreach Portal
          </a>
          <a href="https://www.vlab.co.in/faq" target="_blank" rel="noreferrer">
            FAQ: Virtual Labs
          </a>
        </div>
        <div>
          <h3>Contact Us</h3>
          <p>Phone: General Information: 011-26582050</p>
          <p>Email: support@vlabs.ac.in</p>
        </div>
        <div>
          <h3>Follow Us</h3>
          <div className="social-links">
            <a
              href="https://twitter.com/TheVirtualLabs"
              target="_blank"
              rel="noreferrer"
              aria-label="Virtual Labs on Twitter"
            >
              𝕏
            </a>
            <a
              className="facebook-link"
              href="https://www.facebook.com/Virtual-Labs-IIT-Delhi-301510159983871/"
              target="_blank"
              rel="noreferrer"
              aria-label="Virtual Labs on Facebook"
            >
              f
            </a>
            <a
              className="youtube-link"
              href="https://www.youtube.com/@virtual-labs"
              target="_blank"
              rel="noreferrer"
              aria-label="Virtual Labs on YouTube"
            >
              ▶
            </a>
            <a
              href="https://www.linkedin.com/company/virtual-labs-iit-delhi/"
              target="_blank"
              rel="noreferrer"
              aria-label="Virtual Labs on LinkedIn"
            >
              in
            </a>
          </div>
        </div>
      </div>
      <div className="footer-license">
        <a
          href="https://www.gnu.org/licenses/agpl-3.0.en.html"
          target="_blank"
          rel="noreferrer"
        >
          AGPL 3.0
        </a>
        <span>&amp;</span>
        <a
          href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
          target="_blank"
          rel="noreferrer"
        >
          Creative Commons (CC BY-NC-SA 4.0)
        </a>
      </div>
    </footer>
  );
}

export default function Home() {
  const [section, setSection] = useState<Section>('Aim');
  const [menuOpen, setMenuOpen] = useState(true);
  const [feedbackOpened, setFeedbackOpened] = useState(false);
  useEffect(() => {
    const updateHash = () => {
      const hash = window.location.hash.slice(1).toLowerCase();
      const aliases: Record<string, Section> = {
        'pre-test': 'Pretest',
        experiment: 'Simulation',
        observation: 'Simulation',
        'post-test': 'Posttest',
      };
      const found =
        sections.find((item) => slugs[item] === hash) || aliases[hash];
      if (found) setSection(found);
    };
    updateHash();
    window.addEventListener('hashchange', updateHash);
    return () => window.removeEventListener('hashchange', updateHash);
  }, []);
  function select(name: Section, openFeedback = false) {
    setSection(name);
    if (openFeedback) setFeedbackOpened(true);
    window.history.replaceState(null, '', `#${slugs[name]}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const content =
    section === 'Aim' ? (
      <Aim />
    ) : section === 'Theory' ? (
      <Theory />
    ) : section === 'Pretest' ? (
      <Quiz kind="pre" />
    ) : section === 'Procedure' ? (
      <Procedure />
    ) : section === 'Simulation' ? (
      <Suspense fallback={<p role="status">Opening the visual laboratory…</p>}>
        <Experiment />
      </Suspense>
    ) : section === 'Posttest' ? (
      <Quiz kind="post" />
    ) : section === 'References' ? (
      <References />
    ) : section === 'Contributors' ? (
      <Contributors />
    ) : (
      <Feedback openedInitially={feedbackOpened} />
    );
  return (
    <div className="lab-site">
      <a href="#main-content" className="skip-link">
        Skip to experiment content
      </a>
      <header className="site-header">
        <button
          className="menu-toggle"
          type="button"
          aria-label="Toggle section navigation"
          aria-expanded={menuOpen}
          aria-controls="experiment-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Menu />
        </button>
        <a className="brand" href="#aim" onClick={() => select('Aim')}>
          <img
            src="/vlabs-logo.jpg"
            alt="Virtual Labs — An MoE Government of India Initiative"
          />
        </a>
        <div className="header-actions">
          <span className="rating-stars" aria-label="Rated three out of five">
            ★★★☆☆
          </span>
          <button type="button" onClick={() => select('Feedback', true)}>
            Rate Me
          </button>
          <button type="button" onClick={() => select('Feedback', true)}>
            Report a Bug
          </button>
        </div>
      </header>
      <div className="orange-separator" />
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <span>Computer Science and Engineering</span>
        <ChevronRight />
        <span>Web Development Lab</span>
        <ChevronRight />
        <span>Experiments</span>
      </nav>
      <div className={`page-layout ${!menuOpen ? 'nav-hidden' : ''}`}>
        {menuOpen && (
          <aside id="experiment-navigation" className="sidebar">
            <nav aria-label="Experiment sections">
              {sections.map((name) => (
                <a
                  href={`#${slugs[name]}`}
                  key={name}
                  aria-current={section === name ? 'page' : undefined}
                  className={section === name ? 'active' : ''}
                  onClick={() => select(name)}
                >
                  {name}
                </a>
              ))}
            </nav>
          </aside>
        )}
        <main id="main-content" className="experiment-content">
          <h1>Models and Views in Django</h1>
          <div className="section-body">{content}</div>
        </main>
      </div>
      <VLabFooter />
    </div>
  );
}
