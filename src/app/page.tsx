import Section from "@/components/Section";

export default function HomePage() {
  return (
    <main className="p-6 space-y-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-white">
        Top 100 Youth Cup
      </h1>
      <p className="text-gray-400 mb-10">
        Welcome to the Season 26 Youth Cup hub. Here you can view entrants,
        groups, fixtures, and standings.
      </p>

      <Section title="Entrants">
        <p className="text-gray-300">
          Entrants list will appear here. (Table or grid view)
        </p>
      </Section>

      <Section title="Groups">
        <p className="text-gray-300">
          Groups will be displayed here. (Group allocations / draws)
        </p>
      </Section>

      <Section title="Fixtures">
        <p className="text-gray-300">
          Fixtures will be displayed here. (Match schedule)
        </p>
      </Section>

      <Section title="Standings">
        <p className="text-gray-300">
          Standings will be displayed here. (League tables / rankings)
        </p>
      </Section>
    </main>
  );
}