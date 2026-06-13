import './style.css'

// ===== USAGE DATABASE =====
const DB = {
  browser: { chrome: 67, safari: 17, edge: 5, firefox: 3, samsung: 3, opera: 2 },
  language: { eng: 53.6, spanish: 6, german: 4.5, japanese: 4.3, french: 4.3, portuguese: 3.1 },
  os: { android: 34.9, windows: 30, ios: 16.8, macos: 7, linux: 2, chromeos: 1.5 },
  cpu: { '8': 34.17, '4': 20.14, '6': 22.5, '16': 4.2, '10': 0.54, '12': 0.5 },
  screen: {
    '1920x1080': 8.33, '414x896': 6.51, '360x800': 5.47,
    '1280x1200': 4.53, '375x812': 4.26, '800x600': 3.55,
  },
  memory: { '16': 20, '8': 35, '32': 15, '4': 15, '6': 8, '12': 7 },
  timezone: {
    china: 12, india: 18, us: 25, indonesia: 10,
    brazil: 8, russia: 7, pakistan: 6, mexico: 5, nigeria: 5, japan: 4,
  },
  webgl: { 'google inc': 65, 'apple inc': 18, intel: 55, nvidia: 18, amd: 12, microsoft: 4 },
}

const WEIGHTS = {
  webgl: 2.5, timezone: 2.0, os: 1.8, browser: 1.5,
  cpu: 1.2, memory: 1.2, screen: 1.0, language: 0.8,
}
const TOTAL_WEIGHT = Object.values(WEIGHTS).reduce((a, b) => a + b, 0)

// ===== USAGE LOOKUP FUNCTIONS =====
function browserUsage(ua) {
  const u = ua.toLowerCase()
  if (/samsungbrowser/.test(u)) return DB.browser.samsung
  if (/opr\/|opera/.test(u))   return DB.browser.opera
  if (/edg\/|edge/.test(u))    return DB.browser.edge
  if (/firefox/.test(u))       return DB.browser.firefox
  if (/chrome/.test(u))        return DB.browser.chrome
  if (/safari/.test(u))        return DB.browser.safari
  return 10
}

function languageUsage(lang) {
  const code = lang.toLowerCase().split(/[-_]/)[0]
  const map = { en: DB.language.eng, es: DB.language.spanish, de: DB.language.german, ja: DB.language.japanese, fr: DB.language.french, pt: DB.language.portuguese }
  return map[code] || 10
}

function osUsage(ua) {
  const u = ua.toLowerCase()
  if (/android/.test(u))        return DB.os.android
  if (/iphone|ipad|ipod/.test(u)) return DB.os.ios
  if (/cros/.test(u))           return DB.os.chromeos
  if (/windows/.test(u))        return DB.os.windows
  if (/mac os x|macintosh/.test(u)) return DB.os.macos
  if (/linux/.test(u))          return DB.os.linux
  return 1
}

function cpuUsage(cores) {
  return DB.cpu[String(cores)] ?? 10
}

function screenUsage(w, h) {
  return DB.screen[`${w}x${h}`] ?? 30
}

function memoryUsage(gb) {
  return DB.memory[String(gb)] ?? 10
}

function timezoneUsage(tz) {
  const t = tz.toLowerCase()
  if (/shanghai|beijing|chongqing|chungking|harbin|urumqi/.test(t))  return DB.timezone.china
  if (/kolkata|calcutta|mumbai|delhi/.test(t))                       return DB.timezone.india
  if (/america\/(new_york|chicago|denver|los_angeles|phoenix|anchorage|detroit|indiana)/.test(t) || /^us\//.test(t)) return DB.timezone.us
  if (/jakarta|makassar|jayapura/.test(t))                           return DB.timezone.indonesia
  if (/sao_paulo|brazil|fortaleza|manaus|recife|belem/.test(t))      return DB.timezone.brazil
  if (/moscow|ekaterinburg|novosibirsk|vladivostok|sakhalin/.test(t)) return DB.timezone.russia
  if (/karachi/.test(t))                                             return DB.timezone.pakistan
  if (/mexico_city|monterrey|guadalajara|merida/.test(t))            return DB.timezone.mexico
  if (/lagos|kano|abuja/.test(t))                                    return DB.timezone.nigeria
  if (/tokyo|osaka/.test(t))                                         return DB.timezone.japan
  return 2
}

function webglUsage(vendor) {
  const v = vendor.toLowerCase()
  if (v.includes('google'))    return DB.webgl['google inc']
  if (v.includes('apple'))     return DB.webgl['apple inc']
  if (v.includes('intel'))     return DB.webgl.intel
  if (v.includes('nvidia'))    return DB.webgl.nvidia
  if (v.includes('amd') || v.includes('radeon') || v.includes('ati')) return DB.webgl.amd
  if (v.includes('microsoft')) return DB.webgl.microsoft
  return 1
}

// ===== DEVICE INFO COLLECTION =====
function getDeviceInfo() {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
  let webglVendor = 'Unknown', webglRenderer = 'Unknown'
  if (gl) {
    try {
      const debug = gl.getExtension('WEBGL_debug_renderer_info')
      if (debug) {
        webglVendor   = gl.getParameter(debug.UNMASKED_VENDOR_WEBGL)
        webglRenderer = gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
      } else {
        webglVendor = gl.getParameter(gl.VENDOR)
      }
    } catch (_) {}
  }

  const ua = navigator.userAgent
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const tzOffset = -new Date().getTimezoneOffset()
  const tzSign   = tzOffset >= 0 ? '+' : '-'
  const tzHH     = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0')
  const tzMM     = String(Math.abs(tzOffset) % 60).padStart(2, '0')

  // Readable browser string
  let browserStr = 'Unknown'
  const chromeM = ua.match(/Chrome\/([\d.]+)/)
  const ffM     = ua.match(/Firefox\/([\d.]+)/)
  const safM    = ua.match(/Version\/([\d.]+).*Safari/)
  const edgeM   = ua.match(/Edg\/([\d.]+)/)
  const oprM    = ua.match(/OPR\/([\d.]+)/)
  const samM    = ua.match(/SamsungBrowser\/([\d.]+)/)
  if (samM)       browserStr = `Samsung Browser ${samM[1]}`
  else if (oprM)  browserStr = `Opera ${oprM[1]}`
  else if (edgeM) browserStr = `Edge ${edgeM[1]}`
  else if (chromeM) browserStr = `Chrome ${chromeM[1]}`
  else if (ffM)   browserStr = `Firefox ${ffM[1]}`
  else if (safM)  browserStr = `Safari ${safM[1]}`

  // Readable OS string
  let osStr = 'Unknown'
  if (/Windows NT 10\.0/.test(ua))      osStr = 'Windows 10/11 (64-bit)'
  else if (/Windows NT 6\.3/.test(ua))  osStr = 'Windows 8.1'
  else if (/Windows NT 6\.1/.test(ua))  osStr = 'Windows 7'
  else if (/Android ([\d.]+)/.test(ua)) osStr = `Android ${ua.match(/Android ([\d.]+)/)[1]}`
  else if (/iPhone OS ([\d_]+)/.test(ua)) osStr = `iOS ${ua.match(/iPhone OS ([\d_]+)/)[1].replace(/_/g,'.')}`
  else if (/iPad.*OS ([\d_]+)/.test(ua))  osStr = `iPadOS ${ua.match(/OS ([\d_]+)/)[1].replace(/_/g,'.')}`
  else if (/CrOS/.test(ua))             osStr = 'ChromeOS'
  else if (/Mac OS X ([\d_]+)/.test(ua)) osStr = `macOS ${ua.match(/Mac OS X ([\d_]+)/)[1].replace(/_/g,'.')}`
  else if (/Linux/.test(ua))            osStr = 'Linux x86_64'

  const lang     = navigator.language || 'Unknown'
  const langFull = (navigator.languages || [lang]).slice(0, 2).join(', ')
  const cores    = navigator.hardwareConcurrency
  const devMem   = navigator.deviceMemory
  const sw       = screen.width
  const sh       = screen.height
  const dpr      = window.devicePixelRatio

  return {
    userAgent: ua,
    browser:   browserStr,
    os:        osStr,
    language:  langFull,
    languageCode: lang,
    timezone:  `${tz} (UTC${tzSign}${tzHH}:${tzMM})`,
    timezoneId: tz,
    screenRes: `${sw} x ${sh}`,
    screenW:   sw,
    screenH:   sh,
    pixelRatio: dpr,
    cpuCores:  cores != null ? `${cores} Cores` : 'Unknown',
    cpuCount:  cores,
    devMem:    devMem != null ? `${devMem} GB` : 'Unknown',
    devMemVal: devMem,
    webglVendor,
    webglRenderer,
  }
}

// ===== SCORING ENGINE =====
function computeScore(info) {
  const ua = info.userAgent
  const uniqueness = {
    browser:  1 - browserUsage(ua)  / 100,
    language: 1 - languageUsage(info.languageCode) / 100,
    os:       1 - osUsage(ua) / 100,
    cpu:      info.cpuCount  != null ? 1 - cpuUsage(info.cpuCount)   / 100 : 0.95,
    screen:   1 - screenUsage(info.screenW, info.screenH) / 100,
    memory:   info.devMemVal != null ? 1 - memoryUsage(info.devMemVal) / 100 : 0.95,
    timezone: 1 - timezoneUsage(info.timezoneId) / 100,
    webgl:    1 - webglUsage(info.webglVendor) / 100,
  }

  // Cap at 0.99 so no percentage reaches 100%
  for (const key in uniqueness) {
    if (uniqueness[key] > 0.99) uniqueness[key] = 0.99
  }

  const weightedSum = Object.entries(WEIGHTS).reduce((sum, [key, w]) => sum + (uniqueness[key] ?? 0) * w, 0)
  const riskScore = Math.round((weightedSum / TOTAL_WEIGHT) * 100)

  return { riskScore, uniqueness }
}

// ===== FINGERPRINT HASH =====
async function hashData(info) {
  const str = [info.userAgent, info.timezoneId, info.screenRes, info.languageCode,
    info.cpuCount, info.devMemVal, info.webglVendor, info.webglRenderer].join('|')
  try {
    const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('').slice(0,32)
  } catch (_) {
    return Math.abs(str.split('').reduce((h,c) => (Math.imul(31,h) + c.charCodeAt(0)) | 0, 0))
      .toString(16).padStart(8,'0').repeat(4).slice(0,32)
  }
}

// ===== NAVIGATION =====
const navItems = document.querySelectorAll('.nav-item')
const pages    = document.querySelectorAll('.page')

function showPage(pageId) {
  pages.forEach(p => p.classList.remove('active'))
  const t = document.getElementById('page-' + pageId)
  if (t) t.classList.add('active')
  
}

function setActiveNav(name) {
  navItems.forEach(i => i.classList.toggle('active', i.dataset.page === name))
}

navItems.forEach(item => {
  item.addEventListener('click', () => {
    showPage(item.dataset.page)
    setActiveNav(item.dataset.page)
  })
})

document.querySelectorAll('[data-nav="coming-soon"]').forEach(btn => {
  btn.addEventListener('click', () => { showPage('coming-soon'); setActiveNav(null) })
})

document.getElementById('back-to-dashboard').addEventListener('click', () => {
  showPage('dashboard'); setActiveNav('dashboard')
})

// ===== BAR ANIMATION =====
function animateBars() {
  document.querySelectorAll('.bd-bar[data-w], .mc-bar[data-w]').forEach(bar => {
    const w = bar.getAttribute('data-w')
    if (!w || w === '0%') return
    bar.style.width = '0%'
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = w }))
  })
}

// ===== GAUGE ANIMATION =====
function animateGauge(targetScore, durationMs = 1200) {
  const arc   = document.getElementById('gauge-arc')
  const numEl = document.getElementById('risk-number')
  const denomEl = document.getElementById('risk-denom')
  const C     = 490
  const endOff = C * (1 - targetScore / 100)
  const t0     = performance.now()
  denomEl.textContent = '/100'

  function step(now) {
    const p    = Math.min((now - t0) / durationMs, 1)
    const ease = 1 - Math.pow(1 - p, 3)
    arc.setAttribute('stroke-dashoffset', C - (C - endOff) * ease)
    numEl.textContent = Math.round(targetScore * ease)
    if (p < 1) requestAnimationFrame(step)
    else { numEl.textContent = targetScore; arc.setAttribute('stroke-dashoffset', endOff) }
  }
  requestAnimationFrame(step)
}

// ===== SIDEBAR RING ANIMATION =====
function animateSidebarRing(anonScore, durationMs = 1200) {
  const arc     = document.getElementById('score-ring-arc')
  const pctEl   = document.getElementById('score-pct')
  const badgeEl = document.getElementById('score-label-badge')
  const C       = 226.2
  const endOff  = C * (1 - anonScore / 100)
  const t0      = performance.now()

  function step(now) {
    const p    = Math.min((now - t0) / durationMs, 1)
    const ease = 1 - Math.pow(1 - p, 3)
    arc.setAttribute('stroke-dashoffset', C - (C - endOff) * ease)
    pctEl.textContent = `${Math.round(anonScore * ease)}%`
    if (p < 1) requestAnimationFrame(step)
    else {
      pctEl.textContent = `${anonScore}%`
      arc.setAttribute('stroke-dashoffset', endOff)

      // Warning-oriented badge and text
      const warn = document.getElementById('score-warning')
      const warnText = document.getElementById('score-warning-text')
      const hint = document.getElementById('score-hint')
      if (warn) warn.style.display = 'flex'
      if (hint) hint.style.display = 'none'

      // Remove old warn classes
      warn.classList.remove('warn-high', 'warn-med', 'warn-low')

      if (anonScore < 40) {
        badgeEl.textContent = 'CRITICAL'
        warn.classList.add('warn-high')
        if (warnText) warnText.innerHTML = 'Your identity is highly exposed.<br>Immediate action recommended.'
      } else if (anonScore < 70) {
        badgeEl.textContent = 'WARNING'
        warn.classList.add('warn-med')
        if (warnText) warnText.innerHTML = 'Your fingerprint is moderately<br>identifiable. Take precautions.'
      } else {
        badgeEl.textContent = 'CAUTION'
        warn.classList.add('warn-low')
        if (warnText) warnText.innerHTML = 'You still leave traceable signals.<br>Additional hardening advised.'
      }

      // Update ring gradient color
      const grad = document.getElementById('scoreGrad')
      if (grad) {
        const stops = grad.querySelectorAll('stop')
        if (anonScore < 40) {
          stops[0].style.stopColor = '#ff4444'; stops[1].style.stopColor = '#ff6b35'
        } else if (anonScore < 70) {
          stops[0].style.stopColor = '#ff8800'; stops[1].style.stopColor = '#f59e0b'
        } else {
          stops[0].style.stopColor = '#22c55e'; stops[1].style.stopColor = '#00d4ff'
        }
      }

      // Update pct and badge color
      if (anonScore < 40) {
        pctEl.style.color = '#ff5555'
        pctEl.style.textShadow = '0 0 14px rgba(255,80,80,0.6)'
        badgeEl.style.color = '#ff5555'
      } else if (anonScore < 70) {
        pctEl.style.color = '#f59e0b'
        pctEl.style.textShadow = '0 0 14px rgba(245,158,11,0.6)'
        badgeEl.style.color = '#f59e0b'
      } else {
        pctEl.style.color = '#22c55e'
        pctEl.style.textShadow = '0 0 14px rgba(34,197,94,0.6)'
        badgeEl.style.color = '#22c55e'
      }
    }
  }
  requestAnimationFrame(step)
}

// ===== BREAKDOWN TABLE UPDATE =====
function impactFromU(u) {
  if (u >= 0.70) return { label: 'High',   cls: 'high',   dotCls: 'red' }
  if (u >= 0.40) return { label: 'Medium', cls: '',       dotCls: 'orange' }
  return               { label: 'Low',    cls: 'low',    dotCls: 'green' }
}

function updateBreakdown(uniqueness) {
  Object.entries(uniqueness).forEach(([metric, u]) => {
    const row = document.querySelector(`.breakdown-row[data-metric="${metric}"]`)
    if (!row) return

    const pct    = Math.round(u * 100)
    const bar    = row.querySelector('.bd-bar')
    const pctEl  = row.querySelector('.bd-pct')
    const impEl  = row.querySelector('.bd-impact')
    const { label, cls, dotCls } = impactFromU(u)

    bar.setAttribute('data-w', `${pct}%`)
    bar.className = `bd-bar ${pct >= 60 ? 'purple' : 'cyan'}`
    pctEl.textContent = `${pct}%`
    impEl.className   = `bd-impact${cls ? ' ' + cls : ''}`
    impEl.innerHTML   = `<span class="impact-dot ${dotCls}"></span>${label}`
  })
  animateBars()
}

// ===== MAJORITY CONTRIBUTORS =====
const METRIC_META = {
  webgl:    { label: 'WebGL Vendor',      key: 'webglVendor' },
  timezone: { label: 'Timezone',          key: 'timezone'    },
  os:       { label: 'OS',               key: 'os'          },
  browser:  { label: 'Browser',          key: 'browser'     },
  cpu:      { label: 'CPU Cores',         key: 'cpuCores'    },
  memory:   { label: 'Device Memory',     key: 'devMem'      },
  screen:   { label: 'Screen Resolution', key: 'screenRes'   },
  language: { label: 'Language',          key: 'language'    },
}

function renderMajorityContributors(info, uniqueness) {
  const list        = document.getElementById('majority-list')
  const placeholder = document.getElementById('majority-placeholder')
  if (!list || !placeholder) return

  const contributors = Object.entries(uniqueness)
    .filter(([, u]) => u >= 0.60)
    .sort(([, a], [, b]) => b - a)

  if (contributors.length === 0) {
    placeholder.style.display = 'flex'
    placeholder.querySelector('span').textContent = 'No attributes exceed 60% uniqueness for your device.'
    list.style.display = 'none'
    return
  }

  placeholder.style.display = 'none'
  list.innerHTML = ''

  contributors.forEach(([metric, u]) => {
    const pct  = Math.round(u * 100)
    const meta = METRIC_META[metric]
    const val  = info[meta.key] || '--'
    const barCls = pct >= 70 ? 'purple' : 'cyan'
    const { label: impLabel, cls: impCls } = impactFromU(u)

    const div = document.createElement('div')
    div.className = 'mc-item'
    div.innerHTML = `
      <div class="mc-info">
        <span class="mc-name">${meta.label}</span>
        <span class="mc-value">${val}</span>
      </div>
      <div class="mc-bar-wrap"><div class="mc-bar ${barCls}" data-w="${pct}%"></div></div>
      <span class="mc-pct">${pct}%</span>
      <span class="mc-tag ${impCls === 'high' ? 'mc-high' : 'mc-medium'}">${impLabel}</span>
    `
    list.appendChild(div)
  })

  list.style.display = 'flex'
  requestAnimationFrame(() => requestAnimationFrame(() => {
    list.querySelectorAll('.mc-bar').forEach(bar => {
      const w = bar.getAttribute('data-w')
      if (w) { bar.style.width = '0%'; requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = w })) }
    })
  }))
}

// ===== RISK LABEL =====
function riskLabel(score) {
  if (score >= 67) return { label: 'HIGH RISK',   cls: 'risk-high',   desc: 'Your browser fingerprint is<br>highly unique and easily trackable.' }
  if (score >= 34) return { label: 'MEDIUM RISK', cls: 'risk-medium', desc: 'Your browser has moderate<br>fingerprint exposure.' }
  return                  { label: 'LOW RISK',    cls: 'risk-low',    desc: 'Your browser fingerprint has<br>relatively low uniqueness.' }
}

// ===== FORMAT SCAN TIME =====
function formatScanTime(date) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const d    = `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
  const h    = date.getHours()
  const m    = String(date.getMinutes()).padStart(2,'0')
  const s    = String(date.getSeconds()).padStart(2,'0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${d}  ${h % 12 || 12}:${m}:${s} ${ampm}`
}

// ===== TOOLTIPS =====
const TIP_TEXT = {
  risk: 'Measures how unique your digital fingerprint is compared to other users. A higher score means you are easier to identify and track across the web.',
  majority: 'Highlights the attributes contributing most to your unique fingerprint. These are the factors that make your browser stand out the most.',
}

const tipPopup     = document.getElementById('tip-popup')
const tipPopupText = document.getElementById('tip-popup-text')
let activeTip = null

document.querySelectorAll('.tip-trigger').forEach(icon => {
  icon.addEventListener('click', (e) => {
    e.stopPropagation()
    const key = icon.dataset.tip
    if (!TIP_TEXT[key]) return

    if (activeTip === icon) {
      tipPopup.classList.remove('visible')
      activeTip = null
      return
    }

    tipPopupText.textContent = TIP_TEXT[key]
    const rect = icon.getBoundingClientRect()
    tipPopup.style.top  = `${rect.bottom + 8}px`
    tipPopup.style.left = `${Math.max(8, Math.min(rect.left - 20, window.innerWidth - 260))}px`
    tipPopup.classList.add('visible')
    activeTip = icon
  })
})

document.addEventListener('click', () => {
  if (activeTip) { tipPopup.classList.remove('visible'); activeTip = null }
})

// ===== PRIVACY ADVISOR =====
// For each changeable metric, find the most common option (highest usage %, lowest uniqueness)
const METRIC_OPTIONS = {
  browser: {
    level: 'yes', label: 'Changeable',
    options: [
      { name: 'Chrome', usage: DB.browser.chrome },
      { name: 'Safari', usage: DB.browser.safari },
      { name: 'Edge', usage: DB.browser.edge },
      { name: 'Firefox', usage: DB.browser.firefox },
      { name: 'Samsung Browser', usage: DB.browser.samsung },
      { name: 'Opera', usage: DB.browser.opera },
    ],
  },
  language: {
    level: 'yes', label: 'Adjustable',
    options: [
      { name: 'English', usage: DB.language.eng },
      { name: 'Spanish', usage: DB.language.spanish },
      { name: 'German', usage: DB.language.german },
      { name: 'Japanese', usage: DB.language.japanese },
      { name: 'French', usage: DB.language.french },
      { name: 'Portuguese', usage: DB.language.portuguese },
    ],
  },
  screen: {
    level: 'partial', label: 'Partially',
    options: [
      { name: '1920x1080', usage: DB.screen['1920x1080'] },
      { name: '414x896', usage: DB.screen['414x896'] },
      { name: '360x800', usage: DB.screen['360x800'] },
      { name: '1280x1200', usage: DB.screen['1280x1200'] },
      { name: '375x812', usage: DB.screen['375x812'] },
      { name: '800x600', usage: DB.screen['800x600'] },
    ],
  },
  os: {
    level: 'partial', label: 'Partially',
    options: [
      { name: 'Android', usage: DB.os.android },
      { name: 'Windows', usage: DB.os.windows },
      { name: 'iOS', usage: DB.os.ios },
      { name: 'macOS', usage: DB.os.macos },
      { name: 'Linux', usage: DB.os.linux },
      { name: 'ChromeOS', usage: DB.os.chromeos },
    ],
  },
  timezone: { level: 'no', label: 'Not feasible', options: [] },
  cpu:      { level: 'no', label: 'Not feasible', options: [] },
  memory:   { level: 'no', label: 'Not feasible', options: [] },
  webgl:    { level: 'no', label: 'Not feasible', options: [] },
}

let lastScanInfo = null
let lastScanUniqueness = null
let lastScanRiskScore = null

function buildAdvisorContent(info, uniqueness, currentRisk) {
  const metricOrder = ['browser', 'language', 'screen', 'os', 'timezone', 'cpu', 'memory', 'webgl']

  // For each changeable metric, find the best recommendation (highest usage %)
  // Only recommend if that option has LOWER uniqueness than current
  const recommendations = {}
  const newUniqueness = { ...uniqueness }

  metricOrder.forEach(key => {
    const opt = METRIC_OPTIONS[key]
    if (opt.level === 'no') return

    // Sort options by usage descending (most common first)
    const sorted = [...opt.options].sort((a, b) => b.usage - a.usage)
    const currentU = uniqueness[key]

    // Find best option that reduces uniqueness (higher usage = lower uniqueness)
    let bestOption = null
    for (const choice of sorted) {
      const candidateU = Math.min(1 - choice.usage / 100, 0.99)
      // Only recommend if this option is more common (lower uniqueness) than current
      if (candidateU < currentU) {
        bestOption = { name: choice.name, usage: choice.usage, newU: candidateU }
        break
      }
    }

    if (bestOption) {
      recommendations[key] = bestOption
      newUniqueness[key] = bestOption.newU
    }
  })

  const newWeightedSum = Object.entries(WEIGHTS).reduce((sum, [key, w]) => sum + (newUniqueness[key] ?? 0) * w, 0)
  const newRisk = Math.round((newWeightedSum / TOTAL_WEIGHT) * 100)
  const riskDrop = currentRisk - newRisk

  let metricsHTML = ''
  metricOrder.forEach(key => {
    const opt = METRIC_OPTIONS[key]
    const u = uniqueness[key]
    const pct = Math.round(u * 100)
    let feasibleCls = opt.level === 'yes' ? 'yes' : opt.level === 'partial' ? 'partial' : 'no'

    let desc = ''
    let newUText = '--'
    let newUCls = 'same'

    if (opt.level === 'no') {
      desc = 'Cannot be changed — this is fixed hardware or location data.'
      feasibleCls = 'no'
    } else if (recommendations[key]) {
      const rec = recommendations[key]
      const recPct = Math.round(rec.newU * 100)
      desc = `Switch to ${rec.name} (${rec.usage}% usage) to blend in with a larger crowd.`
      newUText = `${recPct}%`
      newUCls = recPct < pct ? 'down' : 'same'
      feasibleCls = 'recommended'
    } else {
      desc = 'Already using a common option — no better alternative available.'
      feasibleCls = 'optimal'
    }

    metricsHTML += `
      <div class="advisor-metric">
        <span class="adv-metric-name">${METRIC_META[key].label}</span>
        <span class="adv-metric-action">${desc}</span>
        <span class="adv-feasible ${feasibleCls}">${opt.level === 'no' ? 'Not feasible' : (recommendations[key] ? 'Recommended' : 'Already optimal')}</span>
        <span class="adv-new-u ${newUCls}">${newUText}</span>
      </div>
    `
  })

  const changeableKeys = Object.keys(recommendations)
  const changeDesc = changeableKeys.length > 0
    ? changeableKeys.map(k => METRIC_META[k].label.toLowerCase()).join(', ')
    : ''

  return `
    <div class="advisor-summary">
      <div class="advisor-summary-text">
        Your current risk score is <strong>${currentRisk}/100</strong>. The advisor analyzes which fingerprint attributes can be changed to ones with higher market share, reducing your uniqueness and making you harder to track.
      </div>
    </div>
    <div class="advisor-section-title">METRIC ANALYSIS</div>
    <div class="advisor-metrics">${metricsHTML}</div>
    <div class="advisor-section-title">POTENTIAL IMPROVEMENT</div>
    <div class="advisor-result">
      <div class="adv-result-score">
        <div class="adv-result-current">Current Risk</div>
        <div class="adv-result-num">${currentRisk}</div>
      </div>
      <div class="adv-result-arrow">&rarr;</div>
      <div class="adv-result-score">
        <div class="adv-result-new-label">Projected Risk</div>
        <div class="adv-result-new-num">${newRisk}</div>
        <div class="adv-result-new-label">${riskDrop > 0 ? riskDrop + ' point drop' : 'No change'}</div>
      </div>
      <div class="adv-result-desc">
        ${riskDrop > 0
          ? `Switching to more common options for ${changeDesc} could reduce your risk score by <strong>${riskDrop} points</strong>. Hardware attributes (CPU, memory, GPU, timezone) cannot be changed — consider browser extensions that randomize fingerprinting APIs for further protection.`
          : 'Your changeable attributes are already using the most common options available. Consider using browser extensions that block or randomize fingerprinting APIs for further protection.'}
      </div>
    </div>
  `
}

const advisorModal = document.getElementById('advisor-modal')
const advisorBody  = document.getElementById('advisor-body')
const advisorBtn   = document.getElementById('privacy-advisor-btn')
const advisorClose = document.getElementById('advisor-close')

advisorBtn.addEventListener('click', () => {
  if (lastScanInfo && lastScanUniqueness && lastScanRiskScore != null) {
    advisorBody.innerHTML = buildAdvisorContent(lastScanInfo, lastScanUniqueness, lastScanRiskScore)
  }
  advisorModal.classList.add('visible')
})

advisorClose.addEventListener('click', () => {
  advisorModal.classList.remove('visible')
})

advisorModal.addEventListener('click', (e) => {
  if (e.target === advisorModal) advisorModal.classList.remove('visible')
})

// ===== RUN SCAN =====
let scanning = false

async function runScan() {
  if (scanning) return
  scanning = true

  const btn     = document.getElementById('run-scan-btn')
  const btnText = document.getElementById('scan-btn-text')
  const icon    = document.getElementById('scan-icon')

  btn.classList.add('scanning')
  btnText.textContent = 'SCANNING...'
  icon.classList.add('spin')

  // Simulated scan delay
  await new Promise(r => setTimeout(r, 1600))

  const info     = getDeviceInfo()
  const { riskScore, uniqueness } = computeScore(info)
  const anonScore = Math.max(0, 100 - riskScore)
  const hash     = await hashData(info)
  const old = localStorage.getItem("fp_hash");
if (old) localStorage.setItem("fp_last_hash", old); //remember
  localStorage.setItem("fp_hash", hash); //remember one extra line added

  // Store for Privacy Advisor
  lastScanInfo = info
  lastScanUniqueness = uniqueness
  lastScanRiskScore = riskScore

  // Fill fingerprint overview
  const fieldMap = {
    'fp-browser':  info.browser,
    'fp-language': info.language,
    'fp-os':       info.os,
    'fp-cpu':      info.cpuCores,
    'fp-screen':   info.screenRes + (info.pixelRatio !== 1 ? ` @${info.pixelRatio}x` : ''),
    'fp-memory':   info.devMem,
    'fp-timezone': info.timezone,
    'fp-webgl':    info.webglVendor,
    'fp-hash':     hash,
  }
  Object.entries(fieldMap).forEach(([id, val]) => {
    const el = document.getElementById(id)
    if (el) { el.textContent = val; el.classList.remove('fp-placeholder') }
  })

  // Animate gauges
  animateGauge(riskScore)
  animateSidebarRing(anonScore)

  // Risk label
  const { label, cls, desc } = riskLabel(riskScore)
  const labelEl = document.getElementById('risk-label')
  const descEl  = document.getElementById('risk-desc')
  if (labelEl) { labelEl.textContent = label; labelEl.className = `risk-label ${cls}`; labelEl.style.visibility = 'visible' }
  if (descEl)  { descEl.innerHTML = desc; descEl.style.visibility = 'visible' }

  // Update breakdown + majority contributors
  updateBreakdown(uniqueness)
  renderMajorityContributors(info, uniqueness)

  // Show scan completion time (static, not ticking)
  const dtEl = document.getElementById('scan-datetime')
  if (dtEl) dtEl.textContent = formatScanTime(new Date())

  btn.classList.remove('scanning')
  btnText.textContent = 'RESCAN'
  icon.classList.remove('spin')
  scanning = false
}

document.getElementById('run-scan-btn').addEventListener('click', runScan)
