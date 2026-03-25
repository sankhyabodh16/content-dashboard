import { C, R } from '../../lib/tokens'

export default function FeedCardSkeleton() {
  return (
    <div
      style={{
        backgroundColor: C.bg.surface,
        border: `1px solid ${C.border.default}`,
        borderRadius: R.card,
        padding: '20px 24px',
        marginBottom: '16px',
      }}
    >
      {/* Row 1 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="skeleton" style={{ width: '72px', height: '20px', borderRadius: R.pill }} />
        <div className="skeleton" style={{ width: '100px', height: '14px', borderRadius: R.sm }} />
        <div className="skeleton ml-auto" style={{ width: '48px', height: '14px', borderRadius: R.sm }} />
      </div>
      {/* Title */}
      <div className="skeleton mb-2" style={{ width: '85%', height: '18px', borderRadius: R.sm }} />
      <div className="skeleton mb-4" style={{ width: '60%', height: '18px', borderRadius: R.sm }} />
      {/* Body */}
      <div className="skeleton mb-2" style={{ width: '100%', height: '13px', borderRadius: R.sm }} />
      <div className="skeleton mb-2" style={{ width: '100%', height: '13px', borderRadius: R.sm }} />
      <div className="skeleton mb-4" style={{ width: '70%', height: '13px', borderRadius: R.sm }} />
      {/* Engagement row */}
      <div className="flex items-center gap-3">
        <div className="skeleton" style={{ width: '56px', height: '13px', borderRadius: R.sm }} />
        <div className="skeleton" style={{ width: '72px', height: '13px', borderRadius: R.sm }} />
        <div className="skeleton" style={{ width: '60px', height: '20px', borderRadius: R.sm }} />
        <div className="skeleton" style={{ width: '60px', height: '20px', borderRadius: R.sm }} />
      </div>
    </div>
  )
}
