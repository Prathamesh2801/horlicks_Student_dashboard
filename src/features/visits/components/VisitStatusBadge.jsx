import { Badge } from '../../../components/ui'
import { VISIT_STATUS } from '../../../constants/visit'

export default function VisitStatusBadge({ status }) {
  const s = VISIT_STATUS[status] ?? VISIT_STATUS.draft
  return <Badge tone={s.tone}>{s.label}</Badge>
}
