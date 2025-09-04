import Section from "@/components/Section";

export default function HomePage() {
  return (
    <>
      <Section title="Entrants">
        {/* TODO: Entrants table/list goes here */}
        <p className="text-gray-300">Entrants list will be displayed here.</p>
      </Section>

      <Section title="Groups">
        {/* TODO: Groups UI goes here */}
        <p className="text-gray-300">Groups will be displayed here.</p>
      </Section>

      <Section title="Fixtures">
        {/* TODO: Fixtures UI goes here */}
        <p className="text-gray-300">Fixtures will be displayed here.</p>
      </Section>

      <Section title="Standings">
        {/* TODO: Standings UI goes here */}
        <p className="text-gray-300">Standings will be displayed here.</p>
      </Section>
    </>
  );
}