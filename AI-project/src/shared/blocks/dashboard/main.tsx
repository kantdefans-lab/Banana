export function Main({ children }: { children: React.ReactNode }) {
  return (
    <div className="@container/main flex w-full min-w-0 flex-1 flex-col px-4 py-6 md:px-6">
      {children}
    </div>
  );
}
