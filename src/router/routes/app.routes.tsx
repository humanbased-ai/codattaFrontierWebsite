import { Route } from 'react-router-dom'
import { lazy } from 'react'

import AppLayout from '@/layouts/app-layout'
import UserInfoLayout from '@/layouts/userinfo-layout'

// --- Migration landing (root) ---
// Replaces the prior `Navigate to="/app"` so visitors to `app.codatta.io`
// see the "Codatta is now Humanbased." brand-rename announcement first.
// Existing `/app/*` deep links still work for current users.
const MigrationLanding = lazy(() => import('@/views/migration-landing'))

// --- Home & top-level app pages ---
const Home = lazy(() => import('@/views/home'))
const AppLeaderboard = lazy(() => import('@/views/leaderboard'))
const AppNotification = lazy(() => import('@/views/notification'))
const AppQuestChanllenge = lazy(() => import('@/views/quest/quest-challenge'))
const AppReferral = lazy(() => import('@/views/referral'))
const SubmissionDetail = lazy(() => import('@/views/frontiers/submission-detail'))

// --- Quest ---
const ActivityGroup = lazy(() => import('@/views/quest/activity-group'))
const Activity = lazy(() => import('@/views/quest/activity'))

// --- Airdrop ---
const AirdropActivity = lazy(() => import('@/views/airdrop-activity/home'))
const AirdropLeaderboard = lazy(() => import('@/views/airdrop-activity/leaderboard'))
const AirdropRankingHistory = lazy(() => import('@/views/airdrop-activity/ranking-history'))
const AirdropActivityHistory = lazy(() => import('@/views/airdrop-activity/activity-history'))

// --- User settings ---
const UserInfo = lazy(() => import('@/views/userinfo/index'))
const UserInfoReward = lazy(() => import('@/views/userinfo/reward'))
const UserInfoReputation = lazy(() => import('@/views/userinfo/reputation'))
const UserInfoNFT = lazy(() => import('@/views/userinfo/nft'))
const UserInfoPersonal = lazy(() => import('@/views/userinfo/personal'))
// const UserInfoOnchain = lazy(() => import('@/views/userinfo/onchain'))
const UserinfoUserProfile = lazy(() => import('@/views/userinfo/user-profile'))
const UserInfoDataProfile = lazy(() => import('@/views/userinfo/data-profile'))
const UserInfoDataAssets = lazy(() => import('@/views/userinfo/data-assets'))
const UserInfoDataAssetsLockupDetails = lazy(() => import('@/views/userinfo/data-assets-lockup-details'))
const UserInfoDataAssetsStaking = lazy(() => import('@/views/userinfo/data-assets-staking'))
const UserInfoDid = lazy(() => import('@/views/userinfo/did'))

// --- Data profile detail (outside UserInfoLayout but under /app) ---
const UserInfoDataProfileDetail = lazy(() => import('@/views/userinfo/data-profile-detail'))
const UserInfoDataProfileApp = lazy(() => import('@/views/userinfo/app-data-profile'))
const UserInfoDataProfileAppDetail = lazy(() => import('@/views/userinfo/app-data-profile-detail'))
const OnChainDataVerify = lazy(() => import('@/views/on-chain/onchain-data-verify'))

// --- Data profile ---
const DataProfile = lazy(() => import('@/views/data-profile'))

// --- Frontier (under /app) ---
const FrontierHome = lazy(() => import('@/views/frontiers/home'))
const FashionHome = lazy(() => import('@/views/fashion/home'))
const FrontierHistory = lazy(() => import('@/views/frontiers/history'))

// --- Mobile ---
const UserInfoReputationApp = lazy(() => import('@/views/userinfo/reputation-app'))
const ReferralApp = lazy(() => import('@/views/referral-app'))

export const appRoutes = (
  <>
    <Route index element={<MigrationLanding />} />

    {/* Mobile routes */}
    <Route path="/m">
      <Route path="referral" element={<ReferralApp />} />
    </Route>

    {/* Main app routes (with AppLayout) */}
    <Route path="/app" element={<AppLayout className="max-w-[1560px]" />}>
      <Route index element={<Home />} />
      <Route path="referral" element={<AppReferral />} />

      <Route path="airdrop">
        <Route index element={<AirdropActivity />} />
        <Route path="leaderboard" element={<AirdropLeaderboard />} />
        <Route path="ranking-history" element={<AirdropRankingHistory />} />
        <Route path="activity-history" element={<AirdropActivityHistory />} />
      </Route>

      <Route path="settings" element={<UserInfoLayout />}>
        <Route index element={<UserInfo />} />
        <Route path="account" element={<UserInfo />} />
        <Route path="reward" element={<UserInfoReward />} />
        <Route path="reputation" element={<UserInfoReputation />} />
        <Route path="nft" element={<UserInfoNFT />} />
        <Route path="personal" element={<UserInfoPersonal />} />
        <Route path="user-profile" element={<UserinfoUserProfile />} />
        <Route path="data-profile" element={<UserInfoDataProfile />} />
        <Route path="data-assets" element={<UserInfoDataAssets />} />
        <Route path="data-assets/lockup-details" element={<UserInfoDataAssetsLockupDetails />} />
        <Route path="data-assets/staking" element={<UserInfoDataAssetsStaking />} />
        <Route path="did" element={<UserInfoDid />} />
      </Route>

      <Route path="quest">
        <Route index element={<ActivityGroup />} />
        <Route path=":categoryId" element={<Activity />} />
      </Route>

      <Route path="notification" element={<AppNotification />} />
      <Route path="leaderboard" element={<AppLeaderboard />} />

      <Route path="frontier">
        <Route path=":frontier_id" element={<FrontierHome />} />
        <Route path=":frontier_id/history" element={<FrontierHistory />} />
        <Route path="fashion" element={<FashionHome />} />
      </Route>
    </Route>

    {/* Data profile (public) */}
    <Route path="/data-profile/:network/:address" element={<DataProfile />} />
    <Route path="/app/data/profile/:network/:address" element={<DataProfile />} />

    {/* App routes outside AppLayout */}
    <Route path="/app/quest/:id/challenge" element={<AppQuestChanllenge />} />
    <Route path="/app/submission/:submission_id/detail" element={<SubmissionDetail />} />
    <Route path="/app/settings/data-profile/detail" element={<UserInfoDataProfileDetail />} />
    <Route path="/app/settings/data-profile/app" element={<UserInfoDataProfileApp />} />
    <Route path="/app/settings/data-profile/app/detail" element={<UserInfoDataProfileAppDetail />} />
    <Route path="/app/settings/data-profile/onchain-data-verify" element={<OnChainDataVerify />} />
    <Route path="/app/settings/reputation/app" element={<UserInfoReputationApp />} />
  </>
)
