import { Input, Select } from '../../../components/ui'
import { VISIT_STATUS } from '../../../constants/visit'

export default function Filters({ value, onChange, cities }) {
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value })
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Input placeholder="Search school or staff" value={value.q} onChange={set('q')} aria-label="Search" />
      <Select
        aria-label="City"
        placeholder="All cities"
        value={value.cityId}
        onChange={set('cityId')}
        options={cities.map((c) => ({ value: c.id, label: c.name }))}
      />
      <Select
        aria-label="Status"
        placeholder="All statuses"
        value={value.status}
        onChange={set('status')}
        options={Object.entries(VISIT_STATUS).map(([v, s]) => ({ value: v, label: s.label }))}
      />
    </div>
  )
}
