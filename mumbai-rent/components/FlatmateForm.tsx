"use client";

interface FlatmateFormProps {
  email: string;
  setEmail: (value: string) => void;
}

export default function FlatmateForm({ email, setEmail }: FlatmateFormProps) {
  return (
    <div className="space-y-3 rounded-lg border border-slate-700 bg-void/50 p-3">
      <label className="block">
        <span className="mb-1 block text-xs text-slate-400">Email (private relay only)</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-md border border-slate-700 bg-void px-3 py-2 text-sm text-slate-100 outline-none"
        />
      </label>
    </div>
  );
}
