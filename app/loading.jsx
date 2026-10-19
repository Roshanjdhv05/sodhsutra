export default function Loading() {
  return (
    <div className="container section" aria-busy="true" aria-label="Loading">
      <div className="grid g3">
        {Array.from({ length: 6 }, (_, i) => (
          <div className="skel" key={i}><div className="skel-cover" /><div className="skel-line" /><div className="skel-line s" /></div>
        ))}
      </div>
    </div>
  );
}
