import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";

export default async function ClientDetailsPage({ params }: { params: { id: string } }) {
  const { data: client, error } = await supabase.from("clients").select("*").eq("id", params.id).single();
  if (error || !client) return notFound();

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-card rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-2">{client.name}</h2>
      <div className="mb-2 text-muted-foreground">{client.email}</div>
      <div className="mb-2">Phone: {client.phone || <span className="text-muted-foreground">N/A</span>}</div>
      <div className="mb-2">Company: {client.company || <span className="text-muted-foreground">N/A</span>}</div>
      <div className="mb-2">Notes: {client.notes || <span className="text-muted-foreground">N/A</span>}</div>
      <div className="text-xs text-muted-foreground mt-4">Joined: {new Date(client.created_at).toLocaleDateString()}</div>
    </div>
  );
}
