import userApi, { UserInfo, UserUpdateParams } from '@/apis/user.api'
import CustomAlert from '@/components/account/custom-alert'
import { authRedirect, clearClientAuthentication } from '@/utils/auth'
import React, { useState } from 'react'
import { Button } from 'antd'
import { createRoot } from 'react-dom/client'
import { shortenAddress } from '@/utils/format'
import { toUserFriendlyAddress } from '@tonconnect/sdk'
import { derive } from 'derive-valtio'
import { proxy, useSnapshot } from 'valtio'

const channel = new BroadcastChannel('codatta:social-link')
const userModalIdObj = {
  successModal: 'user-success-modal-' + window.crypto.getRandomValues(new Uint32Array(1))[0],
  errorModal: 'user-error-modal-' + window.crypto.getRandomValues(new Uint32Array(1))[0]
}

function SuccessModal(props: { onClose?: () => void }) {
  const [show, setShow] = useState(true)
  return (
    <CustomAlert
      title={'Success'}
      open={show}
      onClose={() => {
        props.onClose?.()
        setShow(false)
      }}
    >
      <div className="mb-4">{'Congratulations, your account has been successfully connected.'}</div>
      <Button
        shape="round"
        block
        type="primary"
        className="py-5 font-bold"
        onClick={() => {
          props.onClose?.()
          setShow(false)
        }}
      >
        Got it
      </Button>
    </CustomAlert>
  )
}

function ErrorModal(props: { message: string | React.ReactNode; onClose?: () => void }) {
  const [show, setShow] = useState(true)

  return (
    <CustomAlert
      title={'😵Oops!'}
      open={show}
      onClose={() => {
        props.onClose?.()
        setShow(false)
      }}
    >
      <div className="mb-4">{props.message}</div>
      <Button
        shape="round"
        block
        type="primary"
        className="py-5 font-bold"
        onClick={() => {
          props.onClose?.()
          setShow(false)
        }}
      >
        Got it
      </Button>
    </CustomAlert>
  )
}

function showLinkSuccess(callback?: () => void) {
  const rootdom = document.createElement('div')
  rootdom.setAttribute('id', userModalIdObj.successModal)
  document.body.appendChild(rootdom)
  const root = createRoot(document.createElement('div'))
  root.render(<SuccessModal onClose={callback}></SuccessModal>)
}

function closeLinkSuccess() {
  const modalDom = document.getElementById(userModalIdObj.successModal)
  if (modalDom) {
    document.body.removeChild(modalDom)
  }
}

function showLinkError(message: string | React.ReactNode, callback?: () => void) {
  const rootdom = document.createElement('div')
  document.body.appendChild(rootdom)
  const root = createRoot(document.createElement('div'))
  root.render(<ErrorModal onClose={callback} message={message}></ErrorModal>)
}

function closeLinkError() {
  const modalDom = document.getElementById(userModalIdObj.errorModal)
  if (modalDom) {
    document.body.removeChild(modalDom)
  }
}

export interface UserStore {
  info: UserInfo | null
}

const userStore = proxy<UserStore>({
  info: {
    user_data: {
      user_name: '',
      avatar: '',
      referee_code: '',
      user_id: '',
      did: '',
      channel: ''
    },
    user_reputation: 0,
    user_assets: [],
    accounts_data: [],
    social_account_info: []
  }
  // accounts: [],
  // username: '-'
})

const derived = derive({
  username: (get) => getUsername(get(userStore).info),
  reputation: (get) => get(userStore).info?.user_reputation ?? 0,
  points: (get) =>
    get(userStore).info?.user_assets?.filter((asset) => asset.asset_type === 'POINTS')?.[0]?.balance?.amount ?? ''
})

function getUsername(info: UserInfo | null) {
  if (!info) return '-'
  if (info.user_data?.user_name) return info.user_data?.user_name
  const currentAccount = info.accounts_data.find((item) => item.current_account)
  if (!currentAccount) return '-'
  if (['email'].includes(currentAccount.account_type)) {
    return currentAccount.account
  } else if (['blockchain', 'wallet', 'block_chain'].includes(currentAccount.account_type)) {
    if (['-239', '-3'].includes(currentAccount.chain)) {
      return shortenAddress(toUserFriendlyAddress(currentAccount.account), 12)
    } else {
      return shortenAddress(currentAccount.account, 12)
    }
  }
  return '-'
}

export function useUserStore() {
  return {
    ...useSnapshot(userStore),
    ...derived
  }
}

async function updateUserInfo(info: UserUpdateParams) {
  await userApi.updateUserInfo(info)
  await getUserInfo()
}

async function linkDiscord() {
  try {
    const { data } = await userApi.getSocialAccountLinkUrl('Discord')
    window.open(data.link, '_blank', 'width=600,height=600')
  } catch (err) {
    showLinkError(err.message)
  }
}

async function linkX() {
  try {
    const { data } = await userApi.getSocialAccountLinkUrl('X')
    window.open(data.link, '_blank', 'width=600,height=600')
  } catch (err) {
    showLinkError(err.message)
  }
}

async function linkTelegram() {
  console.log(import.meta.env)
  const data = await new Promise((resolve) => {
    const BOT_ID = import.meta.env.VITE_TG_BOT_ID
    window.Telegram.Login.auth({ bot_id: BOT_ID, request_access: true }, (data: unknown) => resolve(data))
  })
  if (!data) return
  try {
    await userApi.linkSocialAccount('Telegram', data)
    showLinkSuccess(() => channel.postMessage('update'))
  } catch (err) {
    showLinkError(err.message)
  }
}

async function unlinkSocialAccount(type: string) {
  const res = await userApi.unlinkSocialAccount(type)
  console.log(res)
}

async function getUserInfo() {
  const { data } = await userApi.getUserInfo()
  userStore.info = data
  // userStore.info.user_data.did = ''
  return data
}

function logout() {
  clearClientAuthentication()
  const url = authRedirect()
  window.location.href = url
}

function checkLogin() {
  const userAgent = navigator.userAgent.toLowerCase()
  const token = localStorage.getItem('token')
  const uid = localStorage.getItem('uid')
  const auth = localStorage.getItem('auth')
  if (userAgent.includes('codatta')) {
    return !!auth && !!uid
  }
  return !!token && !!uid && !!auth
}

export const userStoreActions = {
  linkDiscord,
  linkX,
  linkTelegram,
  unlinkSocialAccount,
  updateUserInfo,
  getUserInfo,
  showLinkSuccess,
  showLinkError,
  closeLinkSuccess,
  closeLinkError,
  logout,
  checkLogin
}
