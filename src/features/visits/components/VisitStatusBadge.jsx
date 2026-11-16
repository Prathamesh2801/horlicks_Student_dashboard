import { MdCheck } from 'react-icons/md'
import { Badge } from '../../../components/ui'
import { VISIT_STATUS } from '../../../constants/visit'

export default function VisitStatusBadge({ status, className }) {
  const s = VISIT_STATUS[status] ?? VISIT_STATUS.draft
  return (
    <Badge tone={s.tone} className={className}>
      {status === 'completed' && <MdCheck />}
      {s.label}
    </Badge>
  )
}
