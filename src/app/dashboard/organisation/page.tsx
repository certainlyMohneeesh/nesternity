import { OrganisationList } from "@/components/organisation/organisation-list";

export default function OrganisationsPage() {
  return (
    <div className="container max-w-screen-2xl px-4 md:px-8 py-6 space-y-6">
      <OrganisationList />
    </div>
  );
}
