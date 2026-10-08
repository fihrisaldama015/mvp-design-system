import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { X } from "lucide-react";
import { useStore } from "data/store";
import { TICKET_STATUSES, personByName, photo } from "data/mock";

export default function TicketDetail() {
  const { id } = useParams();
  const { tickets, equipment, setTicketStatus, addComment } = useStore();
  const ticket = tickets.find((t) => t.id === id);
  const [text, setText] = useState("");
  const [shot, setShot] = useState(null);

  if (!ticket) {
    return (
      <div className="text-rose-900">
        Ticket not found.{" "}
        <Link to="/maintenance" className="underline">
          Back to maintenance
        </Link>
      </div>
    );
  }

  const item = equipment.find((e) => e.id === ticket.equipmentId);
  const photos = [photo(`${ticket.id}-a`, `${ticket.id} photo 1`), photo(`${ticket.id}-b`, `${ticket.id} photo 2`)];

  const send = () => {
    if (!text.trim()) return;
    addComment(ticket.id, "You", text.trim());
    setText("");
  };

  return (
    <div className="max-w-5xl">
      <Link to="/maintenance" className="text-sm text-rose-600">
        ← Maintenance
      </Link>
      <div className="mt-2 mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-rose-900">{ticket.title}</h1>
          <p className="text-sm text-gray-500">
            {ticket.id} opened {ticket.createdAt} by {ticket.reporter}
          </p>
        </div>
        {ticket.status !== "Resolved" && (
          <button onClick={() => setTicketStatus(ticket.id, "Resolved")} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white">
            Mark as resolved
          </button>
        )}
      </div>

      <div className="grid grid-cols-[1fr_280px] gap-6">
        <div>
          <ul className="space-y-4">
            {ticket.comments.map((c, i) => {
              const mine = c.author === "You";
              const person = personByName(c.author);
              return (
                <li key={i} className={`flex gap-3 ${mine ? "flex-row-reverse" : ""}`}>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${mine ? "bg-rose-600 text-white" : "bg-gray-200 text-gray-700"}`}>
                    {c.author
                      .split(" ")
                      .map((w) => w[0])
                      .join("")}
                  </div>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${mine ? "bg-rose-600 text-white" : "bg-white border border-gray-200 text-gray-800"}`}>
                    <div className={`mb-1 text-xs ${mine ? "text-rose-100" : "text-gray-400"}`}>
                      {person ? (
                        <Link to={`/people/${person.id}`} className="font-semibold hover:underline">
                          {c.author}
                        </Link>
                      ) : (
                        <b>{c.author}</b>
                      )}{" "}
                      · {c.at}
                    </div>
                    {c.text}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send();
              }}
              rows={3}
              placeholder="Write a comment"
              className="w-full resize-none text-sm outline-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Ctrl + Enter to send</span>
              <button onClick={send} disabled={!text.trim()} className="rounded-lg bg-rose-600 px-4 py-1.5 text-sm text-white disabled:opacity-40">
                Send
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
            <label className="mb-1 block text-xs font-semibold text-gray-400">STATUS</label>
            <select value={ticket.status} onChange={(e) => setTicketStatus(ticket.id, e.target.value)} className="w-full rounded-lg border border-gray-300 px-2 py-2">
              {TICKET_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <div className="mt-4 text-xs font-semibold text-gray-400">PRIORITY</div>
            <div className="mt-1">{ticket.priority}</div>
            <div className="mt-4 text-xs font-semibold text-gray-400">ITEM</div>
            <Link to={`/equipment/${ticket.equipmentId}`} className="mt-1 block text-rose-700 underline">
              {item?.name ?? ticket.equipmentId}
            </Link>
            <div className="text-xs text-gray-500">{item?.status}</div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-2 text-xs font-semibold text-gray-400">PHOTOS</div>
            <div className="grid grid-cols-2 gap-2">
              {photos.map((src, i) => (
                <button key={src} onClick={() => setShot({ src, caption: `${ticket.id} photo ${i + 1}` })}>
                  <img src={src} alt="" className="h-20 w-full rounded-lg object-cover" />
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {shot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setShot(null)}>
          <div className="relative rounded-xl bg-white p-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button className="absolute -right-3 -top-3 rounded-full bg-white p-1 shadow" onClick={() => setShot(null)} aria-label="Close photo">
              <X size={18} />
            </button>
            <img src={shot.src} alt="" className="max-h-[70vh] rounded-lg" />
            <div className="mt-2 text-center text-sm text-gray-600">{shot.caption}</div>
          </div>
        </div>
      )}
    </div>
  );
}
