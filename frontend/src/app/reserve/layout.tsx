// Skip static prerender - reserve page uses useSearchParams() and API calls
export const dynamic = "force-dynamic";

export default function ReserveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
