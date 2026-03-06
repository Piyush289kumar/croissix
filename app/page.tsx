import CibilScore from "@/components/cards/Cibilscore";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4">
      {/* // Custom values */}
      <CibilScore score={300} change={12} min={0} max={500} />
    </section>
  );
}
