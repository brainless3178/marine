import { WhatsAppIcon } from '../components/ui/WhatsAppIcon'
import { useStoreSettings } from '../hooks/useStoreSettings'

export function WhatsAppFloat() {
  const { whatsappNumber } = useStoreSettings()

  if (!whatsappNumber) return null

  return (
    // z-index scale: content < float (45) < sticky header (50) < cart drawer (59/60) < modals (100/110) < toast & cookie consent (200)
    <a
      href={`https://wa.me/${whatsappNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-6 right-6 z-[45] flex items-center gap-0 rounded-full bg-[#25D366] text-white shadow-[0_4px_20px_rgba(37,211,102,0.35)] transition-all duration-300 hover:gap-3 hover:pr-5 hover:shadow-xl hover:shadow-[#25D366]/25 animate-[whatsappFloatIn_0.5s_ease-out_both]"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] transition-transform duration-300 group-hover:scale-105">
        <WhatsAppIcon size={26} className="text-white" />
      </span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-300 group-hover:max-w-[120px]">
        Chat with us
      </span>
    </a>
  )
}
