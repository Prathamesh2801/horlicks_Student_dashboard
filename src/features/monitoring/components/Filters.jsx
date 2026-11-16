import { MdSearch } from 'react-icons/md'
import { Input, Select } from '../../../components/ui'
import { PERIODS, VISIT_STATUS } from '../../../constants/visit'

export default function Filters({ value, onChange, cities }) {
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value })
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_repeat(3,11rem)]">
      <Input icon={MdSearch} type="search" placeholder="Search school or staff" value={value.q} onChange={set('q')} aria-label="Search" />
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
      <Select aria-label="Period" value={value.period} onChange={set('period')} options={PERIODS} />
    </div>
  )
}
