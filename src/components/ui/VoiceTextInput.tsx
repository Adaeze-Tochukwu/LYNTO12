import { useEffect, useRef, type ChangeEvent } from 'react'
import { TextArea, type TextAreaProps } from './TextArea'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { Mic, MicOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface VoiceTextInputProps extends TextAreaProps {
  value?: string
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void
}

export function VoiceTextInput({ value = '', onChange, maxLength, ...props }: VoiceTextInputProps) {
  const { isListening, transcript, startListening, stopListening, isSupported } =
    useSpeechRecognition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Append transcribed text when transcript updates
  useEffect(() => {
    if (!transcript || !onChange) return

    const separator = value && !value.endsWith(' ') ? ' ' : ''
    let newValue = value + separator + transcript

    if (maxLength && newValue.length > maxLength) {
      newValue = newValue.slice(0, maxLength)
    }

    // Synthesize a change event
    const nativeEvent = new Event('input', { bubbles: true })
    const syntheticEvent = {
      ...nativeEvent,
      target: { ...textareaRef.current, value: newValue },
      currentTarget: { ...textareaRef.current, value: newValue },
    } as unknown as ChangeEvent<HTMLTextAreaElement>

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
    <div className="relative">
      <TextArea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        {...props}
      />
      {isSupported && (
        <button
          type="button"
          onClick={toggleListening}
          className={cn(
            'absolute bottom-10 right-3 p-2 rounded-full transition-all duration-200',
            isListening
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
      )}
    </div>
  )
}
