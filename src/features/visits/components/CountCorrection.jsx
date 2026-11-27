import { useState } from 'react'
import { Button, Card, Input } from '../../../components/ui'
import { correctCount, getCountHistory } from '../../../services/api/visits.service'
import { formatDateTime, formatNumber } from '../../../utils/format'

const digits = (v) => v.replace(/\D/g, '').slice(0, 6)

// Admin control panel on a visit: correct the unique student count (when the AI missed people) and enter the
// Collateral Count. Server: Admin/visit_count.php — every change is kept with who, when and why; the AI keeps a
// corrected count ("Count again" replaces it).
export default function CountCorrection({ visit }) {
  const [count, setCount] = useState(null) // typed, not saved (null = unchanged)
  const [collateral, setCollateral] = useState(null)
  const [history, setHistory] = useState(null)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null) // 'saved' | error message

  const countText = count ?? (visit.headcount == null ? '' : String(visit.headcount))
  const collateralText = collateral ?? (visit.collateralCount == null ? '' : String(visit.collateralCount))
  const countChanged = countText !== '' && Number(countText) !== visit.headcount
  const collateralChanged = collateralText !== '' && Number(collateralText) !== visit.collateralCount

  const save = async () => {
    setSaving(true)
    setResult(null)
    try {
      await correctCount(visit.id, {
        count: countChanged ? countText : null,
        collateral: collateralChanged ? collateralText : null,
      })
      setCount(null)
      setCollateral(null)
      setResult('saved')
      if (history) setHistory(await getCountHistory(visit.id).catch(() => history))
    } catch (err) {
      setResult(err.message)
    }
    setSaving(false)
  }
  const showHistory = async () => setHistory(await getCountHistory(visit.id).catch(() => []))

  return (
    <Card className="space-y-3 p-5">
      <div>
        <h2 className="font-bold">Admin controls</h2>
        <p className="text-xs text-gray-500">Correct the student count if the AI missed people, and enter the collateral count.</p>
      </div>
      <div className="grid gap-3 sm:max-w-sm">
        <Input
          label="Unique students"
          inputMode="numeric"
          value={countText}
          onChange={(e) => setCount(digits(e.target.value))}
          hint={visit.headcountManual ? 'Corrected by an Admin' : 'Counted by the AI'}
        />
        <Input
          label="Collateral Count"
          inputMode="numeric"
          placeholder="e.g. 12"
          value={collateralText}
          onChange={(e) => setCollateral(digits(e.target.value))}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} loading={saving} disabled={!countChanged && !collateralChanged}>
          Save
        </Button>
        {result === 'saved' && <span className="text-sm font-semibold text-green-700">Saved ✓</span>}
        {result && result !== 'saved' && <span className="text-sm text-accent-600">{result}</span>}
        {!history && (
          <button type="button" onClick={showHistory} className="ml-auto text-sm font-semibold text-brand-700 hover:underline">
            Show changes
          </button>
        )}
      </div>
      {history &&
        (history.length ? (
          <ul className="space-y-1 border-t border-gray-100 pt-3 text-sm">
            {history.map((h) => (
              <li key={h.id} className="text-gray-700">
                {h.count === 'collateral' ? 'Collateral' : 'Students'} {h.from == null ? '—' : formatNumber(h.from)} → <b>{formatNumber(h.to)}</b>
                <span className="text-gray-500">
                  {' '}
                  · {h.by} · {formatDateTime(h.at)}
                  {h.reason && ` · ${h.reason}`}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-t border-gray-100 pt-3 text-sm text-gray-500">No changes yet.</p>
        ))}
    </Card>
  )
}
