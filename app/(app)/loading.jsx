export default function Loading() {
  return (
    <div className="container page" aria-busy="true" aria-label="Memuat">
      <div className="skeleton" style={{ height: 28, width: "40%", marginBottom: 20 }} />
      <div className="skeleton" style={{ height: 220, borderRadius: 12 }} />
    </div>
  );
}
