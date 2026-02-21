import { useEffect, useRef, type ChangeEvent, type TextareaHTMLAttributes } from 'react'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { Mic, MicOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface VoiceTextInputProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  maxLength?: number
  showCount?: boolean
}

export function VoiceTextInput({
  value = '',
  onChange,
  maxLength,
  label,
  error,
  hint,
  showCount = false,
  className,
  id,
  ...props
}: VoiceTextInputProps) {
  const { isListening, transcript, startListening, stopListening, isSupported } =
    useSpeechRecognition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  const currentLength = typeof value === 'string' ? value.length : 0

  // Append transcribed text when transcript updates
  useEffect(() => {
    if (!transcript || !onChange) return

    const currentValue = typeof value === 'string' ? value : ''
    const separator = currentValue && !currentValue.endsWith(' ') ? ' ' : ''
    let newValue = currentValue + separator + transcript

    if (maxLength && newValue.length > maxLength) {
      newValue = newValue.slice(0, maxLength)
    }

    const syntheticEvent = {
      target: { value: newValue },
      currentTarget: { value: newValue },
    } as ChangeEvent<HTMLTextAreaElement>

    onChange(syntheticEvent)
  }, [transcript]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          id={inputId}
          ref={textareaRef}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          className={cn(
            'w-full px-4 py-3 rounded-xl border bg-white text-slate-800 placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'transition-all duration-200 resize-none',
            'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
            'pr-12',
            error
              ? 'border-risk-red focus:ring-risk-red'
              : 'border-slate-200 hover:border-slate-300',
            className
          )}
          {...props}
        />
        <button
          type="button"
          onClick={isSupported ? toggleListening : undefined}
          disabled={!isSupported}
          className={cn(
            'absolute bottom-3 right-3 p-2 rounded-full transition-all duration-200',
            !isSupported
              ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
              : isListening
                ? 'bg-red-100 text-red-600 animate-pulse'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
          )}
          aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
        >
          {isListening ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>
      </div>
      <div className="flex justify-between items-center mt-1.5">
        <div>
          {hint && !error && (
            <p className="text-sm text-slate-500">{hint}</p>
          )}
          {error && <p className="text-sm text-risk-red">{error}</p>}
        </div>
        {showCount && maxLength && (
          <p
            className={cn(
              'text-sm',
              currentLength >= maxLength ? 'text-risk-red' : 'text-slate-400'
            )}
          >
            {currentLength}/{maxLength}
          </p>
        )}
      </div>
    </div>
  )
}
