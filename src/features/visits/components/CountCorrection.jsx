import { useState } from 'react'
import { Button, Card, Input } from '../../../components/ui'
import { correctCount, getCountHistory } from '../../../services/api/visits.service'
import { formatDateTime, formatNumber } from '../../../utils/format'

const digits = (v, n = 6) => v.replace(/\D/g, '').slice(0, n)
const HISTORY_LABEL = { students: 'Unique students', studentCount: 'Student count', collateral: 'Collateral' }

// Admin control panel on a visit: correct the unique student count (when the AI missed people), and the Student
// count and Collateral Count the Ground Team entered (v1.28). Server: Admin/visit_count.php — every change is kept
// with who and when; the AI keeps a corrected count ("Count again" replaces it).
export default function CountCorrection({ visit }) {
  const [count, setCount] = useState(null) // typed, not saved (null = unchanged)
  const [students, setStudents] = useState(null)
  const [collateral, setCollateral] = useState(null)
  const [history, setHistory] = useState(null)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null) // 'saved' | error message

  const text = (typed, saved) => typed ?? (saved == null ? '' : String(saved))
  const changed = (t, saved) => t !== '' && Number(t) !== saved
  const countText = text(count, visit.headcount)
  const studentsText = text(students, visit.studentCount)
  const collateralText = text(collateral, visit.collateralCount)
  const countChanged = changed(countText, visit.headcount)
  const studentsChanged = changed(studentsText, visit.studentCount)
  const collateralChanged = changed(collateralText, visit.collateralCount)

  const save = async () => {
    setSaving(true)
    setResult(null)
    try {
      await correctCount(visit.id, {
        count: countChanged ? countText : null,
        students: studentsChanged ? studentsText : null,
        collateral: collateralChanged ? collateralText : null,
      })
      setCount(null)
      setStudents(null)
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
        <p className="text-xs text-gray-500">
          Correct the unique students if the AI missed people, and the student and collateral counts from the Ground Team.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          label="Unique students"
          inputMode="numeric"
          value={countText}
          onChange={(e) => setCount(digits(e.target.value))}
          hint={visit.headcountManual ? 'Corrected by an Admin' : 'Counted by the AI'}
        />
        <Input
          label="Student count"
          inputMode="numeric"
          placeholder="e.g. 120"
          value={studentsText}
          onChange={(e) => setStudents(digits(e.target.value))}
          hint="Entered by the Ground Team"
        />
        <Input
          label="Collateral Count"
          inputMode="numeric"
          placeholder="e.g. 40"
          value={collateralText}
          onChange={(e) => setCollateral(digits(e.target.value, 7))}
          hint="Entered by the Ground Team"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} loading={saving} disabled={!countChanged && !studentsChanged && !collateralChanged}>
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
                {HISTORY_LABEL[h.count]} {h.from
 == null ? '—' : formatNumber(h.from)} → <b>{formatNumber(h.to)}</b>
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
