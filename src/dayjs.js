import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import 'dayjs/locale/cs'

dayjs.extend(isBetween)
dayjs.locale('cs')

export default dayjs