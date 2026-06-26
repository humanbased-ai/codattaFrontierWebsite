/**
 * Codatta → Humanbased migration landing.
 *
 * Replaces the root `/` redirect to `/app`. When a visitor lands on
 * app.codatta.io they see the brand-rename announcement first, with two
 * pill CTAs:
 *
 *   - "Migrate your account" → https://humanbased.ai/migrate
 *     The destination /migrate page sets the `hb_migrated=true` funnel
 *     cookie on mount itself — we can't drop it from here because
 *     browsers block cross-domain cookie writes (Domain=.humanbased.ai
 *     set from app.codatta.io is silently rejected).
 *
 *   - "Humanbased.ai" → https://humanbased.ai (the marketing home).
 *
 * Layout mirrors the DS reference (Humanbased Design System (1) /
 * ui_kits/contributor/codatta.html): centered 40×40 mark + 64/80 bold
 * headline ("Codatta is now\nHumanbased.") + 288px column of two pills.
 *
 * Existing app paths (`/app/*`, `/account/*`, etc.) still resolve as
 * before — only the root index was redirected. Bookmarks into the legacy
 * app continue to work during the cutover window.
 */

import type { CSSProperties } from 'react'

const SANS = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

const HUMANBASED_MIGRATE_URL = 'https://contributor.humanbased.ai/migrate'
const HUMANBASED_HOME_URL = 'https://contributor.humanbased.ai'

const styles = {
  page: {
    minHeight: '100dvh',
    boxSizing: 'border-box',
    padding: 12,
    background: '#F5F5F5',
    fontFamily: SANS,
  } as CSSProperties,
  panel: {
    width: '100%',
    minHeight: 'calc(100dvh - 24px)',
    background: '#FFFFFF',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    overflow: 'auto',
  } as CSSProperties,
  hero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 32,
  } as CSSProperties,
  title: {
    margin: 0,
    font: `700 64px/80px ${SANS}`,
    color: '#2E2E2E',
    letterSpacing: 0,
    textWrap: 'balance',
  } as CSSProperties,
  actions: {
    marginTop: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    width: 288,
  } as CSSProperties,
  btn: {
    width: '100%',
    height: 44,
    padding: '0 22px',
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 0,
    borderRadius: 100,
    cursor: 'pointer',
    font: `500 14px/22px ${SANS}`,
    textDecoration: 'none',
    transition: 'background 80ms ease, transform 80ms ease',
  } as CSSProperties,
  btnPrimary: {
    background: '#2E2E2E',
    color: '#FFFFFF',
  } as CSSProperties,
  btnSecondary: {
    background: '#F2F2F2',
    color: '#2E2E2E',
  } as CSSProperties,
}

function HBMark({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="40 40 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Humanbased"
    >
      <path
        d="M68.8125 40C77.1952 40 83.9971 46.801 83.9971 55.1875V68.8164C83.9969 77.1989 77.1958 83.9998 68.8096 84H55.1846C46.7981 84 39.9971 77.199 39.9971 68.8125V55.1875C39.9971 46.801 46.798 40 55.1846 40H68.8125ZM50.8232 53.7598C50.4743 54.5183 50.2852 55.3644 50.2852 56.252V67.6318C50.2852 68.5229 50.4745 69.3648 50.8232 70.127C51.4263 71.4735 52.5118 72.559 53.8584 73.1621C54.6206 73.5109 55.4624 73.7001 56.3535 73.7002H67.7334C68.6247 73.7002 69.4671 73.5111 70.2295 73.1621L59.0088 61.9414L50.8232 53.7598ZM56.2979 50.2393C55.4065 50.2393 54.5641 50.4294 53.8018 50.7783L65.0215 61.998L73.207 70.1797C73.556 69.4211 73.7461 68.575 73.7461 67.6875V56.3086C73.7461 55.4172 73.556 54.5749 73.207 53.8125C72.604 52.4661 71.5192 51.3814 70.1729 50.7783C69.4105 50.4294 68.5681 50.2393 67.6768 50.2393H56.2979Z"
        fill="#0A0A0A"
      />
    </svg>
  )
}

export default function MigrationLanding() {
  return (
    <div style={styles.page}>
      <div style={styles.panel}>
        <div style={styles.hero}>
          <HBMark size={40} />
          <h1 style={styles.title}>
            Codatta is now
            <br />
            Humanbased.
          </h1>
          <div style={styles.actions}>
            <a
              style={{ ...styles.btn, ...styles.btnPrimary }}
              href={HUMANBASED_MIGRATE_URL}
            >
              Migrate your account
            </a>
            <a
              style={{ ...styles.btn, ...styles.btnSecondary }}
              href={HUMANBASED_HOME_URL}
            >
              Humanbased.ai
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
