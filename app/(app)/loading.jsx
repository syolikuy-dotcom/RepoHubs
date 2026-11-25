export default function Loading() {
  return (
    <div className="container page" aria-busy="true" aria-label="Memuat">
      <div className="layout layout-main-side">
        <div>
          <div className="skeleton" style={{ height: 32, width: "42%", marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 48, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 120, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 120 }} />
        </div>
        <div>
          <div className="skeleton" style={{ height: 180, marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 140 }} />
        </div>
      </div>
    </div>
  );
}
