import React, { useState, useEffect } from "react";

export default function CompetenceTable() {
  const [entries, setEntries] = useState([]);
  const [name, setName] = useState("");
  const [competence, setCompetence] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterCompetence, setFilterCompetence] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("competence-entries");
    if (stored) {
      setEntries(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("competence-entries", JSON.stringify(entries));
  }, [entries]);

  const handleAddEntry = () => {
    if (name.trim() && competence.trim()) {
      setEntries((prev) => {
        const existing = prev.find((e) => e.name.toLowerCase() === name.toLowerCase());
        if (existing) {
          return prev.map((e) =>
            e.name.toLowerCase() === name.toLowerCase()
              ? { ...e, competences: [...new Set([...e.competences, competence])] }
              : e
          );
        } else {
          return [...prev, { name, competences: [competence] }];
        }
      });
      setName("");
      setCompetence("");
    }
  };

  const handleDeleteEntry = (nameToDelete) => {
    if (window.confirm(`Sei sicuro di voler eliminare ${nameToDelete}?`)) {
      setEntries((prev) => prev.filter((entry) => entry.name !== nameToDelete));
    }
  };

  const handleExportCSV = () => {
    if (entries.length === 0) return;

    const rows = entries.flatMap((entry) =>
      entry.competences.map((comp) => [entry.name, comp])
    );

    const csvHeader = ["Nome", "Competenza"];
    const csvRows = rows.map((r) => r.map((field) => `"${field}"`).join(","));
    const csvContent = [csvHeader.join(","), ...csvRows].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `competenze-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split("\n").slice(1);
      const newEntries = {};

      lines.forEach((line) => {
        if (!line.trim()) return;
        const [nameRaw, compRaw] = line.split(",");
        if (!nameRaw || !compRaw) return;
        const name = nameRaw.replaceAll('"', '').trim();
        const comp = compRaw.replaceAll('"', '').trim();
        if (name && comp) {
          if (!newEntries[name]) {
            newEntries[name] = new Set();
          }
          newEntries[name].add(comp);
        }
      });

      setEntries((prev) => {
        const merged = [...prev];
        for (const name in newEntries) {
          const existing = merged.find((e) => e.name.toLowerCase() === name.toLowerCase());
          const newComps = Array.from(newEntries[name]);
          if (existing) {
            existing.competences = [...new Set([...existing.competences, ...newComps])];
          } else {
            merged.push({ name, competences: newComps });
          }
        }
        return merged;
      });
    };
    reader.readAsText(file);
  };

  const filteredEntries = entries.filter(
    (entry) =>
      entry.name.toLowerCase().includes(filterName.toLowerCase()) &&
      entry.competences.some((comp) =>
        comp.toLowerCase().includes(filterCompetence.toLowerCase())
      )
  );

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto font-sans">
      <div className="bg-white rounded-2xl shadow p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded px-3 py-2 flex-1"
          />
          <input
            type="text"
            placeholder="Competenza"
            value={competence}
            onChange={(e) => setCompetence(e.target.value)}
            className="border rounded px-3 py-2 flex-1"
          />
          <button
            onClick={handleAddEntry}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Aggiungi
          </button>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleExportCSV}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Esporta CSV
          </button>
          <input
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            className="border rounded px-2 py-2"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Filtra per nome"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="border rounded px-3 py-2 flex-1"
          />
          <input
            type="text"
            placeholder="Filtra per competenza"
            value={filterCompetence}
            onChange={(e) => setFilterCompetence(e.target.value)}
            className="border rounded px-3 py-2 flex-1"
          />
        </div>

        <table className="w-full mt-4 border border-gray-300 text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">Nome</th>
              <th className="border px-4 py-2">Competenze</th>
              <th className="border px-4 py-2">Azione</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry, idx) => (
              <tr key={idx}>
                <td className="border px-4 py-2 align-top font-medium">{entry.name}</td>
                <td className="border px-4 py-2">
                  <ul className="list-disc list-inside">
                    {entry.competences.map((comp, i) => (
                      <li key={i}>{comp}</li>
                    ))}
                  </ul>
                </td>
                <td className="border px-4 py-2 text-center">
                  <button
                    onClick={() => handleDeleteEntry(entry.name)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Elimina
                  </button>
                </td>
              </tr>
            ))}
            {filteredEntries.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-4 text-gray-500">
                  Nessun risultato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
