import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { FeedItem } from '../../types'
import { C, R } from '../../lib/tokens'
import FeedCard from '../feed/FeedCard'

interface Props {
  item: FeedItem
  onClose: () => void
}

export default function FeedItemModal({ item, onClose }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '24px',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: R.modal,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.6)',
            border: `1px solid ${C.border.default}`,
            color: C.text.primary,
            cursor: 'pointer',
            zIndex: 1,
          }}
          aria-label="Close"
        >
          <X size={16} strokeWidth={2} />
        </button>
        <FeedCard item={item} />
      </div>
    </div>
  )
}
