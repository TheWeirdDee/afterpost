import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page">
      <div className="empty">
        <h3>We couldn&apos;t find that record</h3>
        <p>It may have been removed, or it belongs to a workspace you don&apos;t have access to.</p>
        <Link href="/app/campaigns" className="btn primary sm">
          Back to campaigns
        </Link>
      </div>
    </div>
  );
}
