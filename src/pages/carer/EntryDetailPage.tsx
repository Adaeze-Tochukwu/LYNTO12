import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { MobileLayout, Header } from '@/components/layout'
import {
  Card,
  Button,
  VoiceTextInput,
  RiskAlert,
  Modal,
} from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { formatDateTime, cn } from '@/lib/utils'
import {
  User,
  Clock,
  Activity,
  FileText,
  AlertTriangle,
  Edit3,
} from 'lucide-react'

export function EntryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { getVisitEntryById, getClientById, getCarerById, addCorrectionNote } = useApp()

  const entry = id ? getVisitEntryById(id) : undefined
  const client = entry ? getClientById(entry.clientId) : undefined
  const carer = entry ? getCarerById(entry.carerId) : undefined

  const [showCorrectionModal, setShowCorrectionModal] = useState(false)
  const [correctionText, setCorrectionText] = useState('')

  if (!entry) {
    return (
      <MobileLayout header={<Header title="Entry" showBack />}>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Entry not found</p>
        </div>
      </MobileLayout>
    )
  }

  const canAddCorrection = user?.id === entry.carerId

  const handleAddCorrection = async () => {
    if (!correctionText.trim() || !user) return
    try {
      await addCorrectionNote(entry.id, user.id, correctionText.trim())
      setCorrectionText('')
      setShowCorrectionModal(false)
    } catch (err) {
      console.error('Failed to add correction note:', err)
    }
  }

  return (
    <MobileLayout header={<Header title="Entry Details" showBack />}>
      <div className="space-y-4 pb-6 animate-fade-in">
        {/* Risk Banner */}
        <RiskAlert level={entry.riskLevel} score={entry.score} />

        {/* Client & Time Info */}
        <Card padding="md">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <User className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Client</p>
                <p className="font-medium text-slate-800">
                  {client?.displayName || 'Unknown'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Recorded</p>
                <p className="font-medium text-slate-800">
                  {formatDateTime(entry.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <User className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Recorded by</p>
                <p className="font-medium text-slate-800">
                  {carer?.fullName || 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Observations */}
        {entry.reasons.length > 0 && (
          <Card padding="md">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-800">Observations</h3>
            </div>
            <ul className="space-y-2">
              {entry.reasons.map((reason, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-slate-600"
                >
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                      entry.riskLevel === 'green' && 'bg-risk-green',
                      entry.riskLevel === 'amber' && 'bg-risk-amber',
                      entry.riskLevel === 'red' && 'bg-risk-red'
                    )}
                  />
                  {reason}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Vitals */}
        {Object.keys(entry.vitals).length > 0 && (
          <Card padding="md">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-800">Vitals Recorded</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {entry.vitals.temperature && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">Temperature</p>
                  <p className="font-semibold text-slate-800">
                    {entry.vitals.temperature}°C
                  </p>
                </div>
              )}
              {entry.vitals.pulse && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">Pulse</p>
                  <p className="font-semibold text-slate-800">
                    {entry.vitals.pulse} bpm
                  </p>
                </div>
              )}
              {entry.vitals.systolicBp && entry.vitals.diastolicBp && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">Blood Pressure</p>
                  <p className="font-semibold text-slate-800">
                    {entry.vitals.systolicBp}/{entry.vitals.diastolicBp}
                  </p>
                </div>
              )}
              {entry.vitals.oxygenSaturation && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">Oxygen Saturation</p>
                  <p className="font-semibold text-slate-800">
                    {entry.vitals.oxygenSaturation}%
                  </p>
                </div>
              )}
              {entry.vitals.respiratoryRate && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">Respiratory Rate</p>
                  <p className="font-semibold text-slate-800">
                    {entry.vitals.respiratoryRate}/min
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Note */}
        {entry.note && (
          <Card padding="md">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-800">Note</h3>
            </div>
            <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3">
              "{entry.note}"
            </p>
          </Card>
        )}

        {/* Correction Notes */}
        {entry.correctionNotes && entry.correctionNotes.length > 0 && (
          <Card padding="md">
            <h3 className="font-semibold text-slate-800 mb-3">Correction Notes</h3>
            <div className="space-y-2">
              {entry.correctionNotes.map((note) => {
                const noteCarer = getCarerById(note.carerId)
                return (
                  <div key={note.id} className="bg-amber-50 rounded-xl p-3">
                    <p className="text-sm text-slate-700">{note.text}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      By {noteCarer?.fullName || 'Unknown'} •{' '}
                      {formatDateTime(note.createdAt)}
                    </p>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Add Correction Button */}
        {canAddCorrection && (
          <Button
            variant="outline"
            fullWidth
            onClick={() => setShowCorrectionModal(true)}
          >
            <Edit3 className="w-5 h-5 mr-2" />
            Add Correction / Clarification
          </Button>
        )}

        <p className="text-xs text-center text-slate-400">
          Decision support only. Follow usual escalation procedures.
        </p>
      </div>

      {/* Correction Modal */}
      <Modal
        isOpen={showCorrectionModal}
        onClose={() => setShowCorrectionModal(false)}
        title="Add Correction Note"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            This note will be attached to the entry without modifying the original
            record. Use it to clarify or correct any observations.
          </p>
          <VoiceTextInput
            value={correctionText}
            onChange={(e) => setCorrectionText(e.target.value)}
            placeholder="e.g., Earlier I ticked 'fall', but it was a near fall - no actual fall."
            rows={4}
            maxLength={300}
            showCount
          />
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowCorrectionModal(false)}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              onClick={handleAddCorrection}
              disabled={!correctionText.trim()}
            >
              Save Note
            </Button>
          </div>
        </div>
      </Modal>
    </MobileLayout>
  )
}
