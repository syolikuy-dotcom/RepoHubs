import { ArrowRight, FileDiff, FileX } from "lucide-react";

function parse(patch) {
  const rows = [];
  let o = 0, n = 0;
  for (const line of patch.split("\n")) {
    if (line.startsWith("@@")) {
      const m = /@@ -(\d+)(?:,\d+)? \+(\d+)/.exec(line);
      o = m ? +m[1] : 0; n = m ? +m[2] : 0;
      rows.push({ t: "hunk", text: line });
    } else if (line.startsWith("+")) rows.push({ t: "add", n: n++, text: line });
    else if (line.startsWith("-")) rows.push({ t: "del", o: o++, text: line });
    else if (line.startsWith("\\")) rows.push({ t: "hunk", text: line });
    else rows.push({ t: "ctx", o: o++, n: n++, text: line.startsWith(" ") ? line : ` ${line}` });
  }
  return rows;
}

const MAX_ROWS = 1500;
const STATUS = { added: "Baru", removed: "Dihapus", renamed: "Diubah nama", modified: "Diubah", changed: "Diubah", copied: "Disalin" };

export default function Diff({ files }) {
  if (!files?.length) return <div className="blank">Tidak ada perubahan file.</div>;
  return (
    <div className="diff">
      {files.map((f) => {
        const rows = f.patch ? parse(f.patch) : null;
        return (
          <div className="box diff-file" key={f.filename + f.sha}>
            <div className="box-header">
              <FileDiff size={16} className="icon muted" />
              <span className="mono wrap-any grow meta" style={{ fontSize: 12 }}>{f.previous_filename && <>{f.previous_filename}<ArrowRight size={12} aria-label="menjadi" /></>}{f.filename}</span>
              <span className="pill">{STATUS[f.status] || f.status}</span>
              <span className="text-sm"><span className="add-t">+{f.additions}</span> <span className="del-t">-{f.deletions}</span></span>
            </div>
            {!rows ? (
              <div className="box-body muted meta"><FileX size={16} aria-hidden="true" />Diff tidak ditampilkan (file biner atau terlalu besar).</div>
            ) : (
              <div className="diff-scroll">
                <table><tbody>
                  {rows.slice(0, MAX_ROWS).map((r, i) => (
                    <tr key={i} className={r.t}>
                      {r.t === "hunk" ? <td colSpan={3}>{r.text}</td> : (<><td className="n">{r.o ?? ""}</td><td className="n">{r.n ?? ""}</td><td>{r.text}</td></>)}
                    </tr>
                  ))}
                </tbody></table>
                {rows.length > MAX_ROWS && <div className="box-body muted">Menampilkan {MAX_ROWS} baris pertama dari {rows.length}.</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
