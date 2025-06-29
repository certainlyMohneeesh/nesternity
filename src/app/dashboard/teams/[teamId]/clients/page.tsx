"use client";
import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
  created_at: string;
  team_id: string;
}

export default function TeamClientsPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = use(params);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<Omit<Client, "id" | "created_at" | "team_id">>({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
  });

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  async function fetchClients() {
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false });
    if (!error && data) setClients(data);
    setLoading(false);
  }

  function handleOpen(editClient?: Client) {
    setEditing(editClient || null);
    setForm(
      editClient
        ? { name: editClient.name, email: editClient.email, phone: editClient.phone, company: editClient.company, notes: editClient.notes }
        : { name: "", email: "", phone: "", company: "", notes: "" }
    );
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      // Update
      await supabase.from("clients").update(form).eq("id", editing.id).eq("team_id", teamId);
    } else {
      // Insert
      await supabase.from("clients").insert([{ ...form, team_id: teamId }]);
    }
    setOpen(false);
    fetchClients();
  }

  async function handleDelete(id: string) {
    await supabase.from("clients").delete().eq("id", id).eq("team_id", teamId);
    fetchClients();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Team Clients</h2>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button onClick={() => handleOpen()}>Add Client</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{editing ? "Edit Client" : "Add Client"}</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <Label>Company</Label>
                <Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
              </div>
              <div>
                <Label>Notes</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <Button type="submit" className="w-full">{editing ? "Update" : "Add"} Client</Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-card rounded-lg shadow">
          <thead>
            <tr className="bg-muted">
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Company</th>
              <th className="p-3 text-left">Notes</th>
              <th className="p-3 text-left">Created</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-6 text-center">Loading...</td></tr>
            ) : clients.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center">No clients found.</td></tr>
            ) : (
              clients.map(client => (
                <tr key={client.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-medium">{client.name}</td>
                  <td className="p-3">{client.email}</td>
                  <td className="p-3">{client.phone}</td>
                  <td className="p-3">{client.company}</td>
                  <td className="p-3">{client.notes}</td>
                  <td className="p-3 text-xs">{new Date(client.created_at).toLocaleDateString()}</td>
                  <td className="p-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleOpen(client)}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(client.id)}>Delete</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
