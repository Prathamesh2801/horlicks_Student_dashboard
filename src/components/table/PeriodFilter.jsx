import { PERIODS } from '../../constants/visit'
import { todayISO } from '../../utils/format'
import { fieldClass } from '../ui'
import Select from '../ui/Select'

// Period select; "Date range…" shows From / To date boxes. State: table.state.period / from / to (in the URL).
export default function PeriodFilter({ table }) {
  const { period, from, to } = table.state
  const date = 'w-[calc(50%-0.25rem)] sm:w-40'
  return (
    <>
      <Select
        className="w-full sm:w-40"
        aria-label="Period"
        value={period}
        onChange={(e) => table.set({ period: e.target.value, from: '', to: '' })}
        options={PERIODS}
      />
      {period === 'custom' && (
        <>
          <input
            type="date"
            aria-label="From"
            title="From"
            value={from}
            max={to || todayISO()}
            onChange={(e) => table.set({ from: e.target.value })}
            className={`${fieldClass.replace('w-full', '')} ${date}`}
          />
          <input
            type="date"
            aria-label="To"
            title="To"
            value={to}
            min={from || undefined}
            max={todayISO()}
            onChange={(e) => table.set({ to: e.target.value })}
            className={`${fieldClass.replace('w-full', '')} ${date}`}
          />
        </>
      )}
    </>
  )
}
