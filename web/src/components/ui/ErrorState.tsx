import BezelCard from "./BezelCard";

export default function ErrorState({ message }: { message: string }) {
  return (
    <BezelCard innerClassName="px-8 py-10 text-center">
      <span className="inline-grid place-items-center size-14 rounded-full bg-danger/10 text-danger mb-4">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
          <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
        </svg>
      </span>
      <h2 className="font-display text-xl font-semibold mb-2">No se pudo consultar SUNAT</h2>
      <p className="text-sm text-danger-600 dark:text-danger-400 max-w-md mx-auto leading-relaxed">{message}</p>
    </BezelCard>
  );
}
