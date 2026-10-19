'use client';

export default function GlobalError({ error, reset }) {
  return (
    <div className="container section">
      <div className="empty" role="alert">
        <h3>Something went wrong</h3>
        <p>The page could not be displayed. {error?.digest ? `(ref ${error.digest})` : ''}</p>
        <div className="row"><button className="btn btn-primary" onClick={() => reset()}>Try again</button><a className="btn btn-ghost" href="/">Go home</a></div>
      </div>
    </div>
  );
}
