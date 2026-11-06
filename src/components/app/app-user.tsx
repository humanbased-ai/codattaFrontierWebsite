import { useUserStore } from '@/stores/user.store'
import { Avatar, Tooltip } from 'antd'
import { LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import { authRedirect, clearClientAuthentication } from '@/utils/auth'
import { TRACK_CATEGORY, trackEvent } from '@/utils/analytics'

export default function AppUser() {
  const { info, username } = useUserStore()

  const handleLogout: React.MouseEventHandler = (e) => {
    e.preventDefault()
    clearClientAuthentication()
    const url = authRedirect()
    trackEvent(TRACK_CATEGORY.BTN_CLICK, { method: 'click', contentType: 'logout' })
    window.location.href = url
  }

  return (
    <div className="py-0.5 pl-3 pr-2 lg:pr-0">
      <Link className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 hover:text-white" to="/app/settings">
        <Avatar className="shrink-0" src={info?.user_data?.avatar} size={24}></Avatar>
        <div className="hidden flex-1 truncate lg:block">{username}</div>
        <Tooltip title="Log out" className="hidden lg:block">
          <div className="py-2 pl-2" onClick={handleLogout}>
            <LogOut size={16}></LogOut>
          </div>
        </Tooltip>
      </Link>
    </div>
  )
}
