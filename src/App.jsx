import React, { useEffect, useMemo, useState } from 'react'

const TRAINING_MODE_KEY = 'trainingMode'
const DAY_MODE_KEY_PREFIX = 'dayMode_'
const WEIGHT_LOG_KEY = 'weightLog'
const RUN_LOG_KEY = 'runLog'
const REP_LOG_KEY = 'repLog'

function formatPace(durationMin, distanceMi) {
  if (!distanceMi) return '—'
  const paceMin = durationMin / distanceMi
  const whole = Math.floor(paceMin)
  const seconds = Math.round((paceMin - whole) * 60)
  return `${whole}:${String(seconds).padStart(2, '0')}/mi`
}

// stable per-exercise key for the rep log, derived from its name so the
// same bodyweight exercise (e.g. "Jump squats" on both Monday and Friday)
// shares one PR history
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}
const NEAR_FAILURE_NOTE = 'Every set to near failure. If you can do 3 more reps, make it harder.'

// Canonical registry of every progressively-tracked lift. `base` is the
// starting weight before any logged history; `inc` is how much the
// suggested "next" weight moves once "base" (or the last logged weight)
// is hit — negative for assisted work, where less assistance is progress.
const TRACKED = {
  benchPress: { label: 'Dumbbell bench press', base: 35, inc: 2.5, unit: 'lbs' },
  cableRow: { label: 'Cable row', base: 100, inc: 5, unit: 'lbs' },
  singleArmRow: { label: 'Single arm row', base: 35, inc: 2.5, unit: 'lbs' },
  facePulls: { label: 'Face pulls', base: 80, inc: 5, unit: 'lbs' },
  bulgarianSplitSquat: { label: 'Bulgarian split squat', base: 20, inc: 5, unit: 'lbs' },
  hipThrust: { label: 'Barbell hip thrusts', base: 90, inc: 10, unit: 'lbs' },
  romanianDeadlift: { label: 'Romanian deadlift', base: 60, inc: 5, unit: 'lbs' },
  cableKickbacks: { label: 'Cable kickbacks', base: 80, inc: 5, unit: 'lbs' },
  cableHipAbduction: { label: 'Cable hip abduction', base: 70, inc: 5, unit: 'lbs' },
  deadlift: { label: 'Deadlift', base: 135, inc: 10, unit: 'lbs' },
  latPulldown: { label: 'Lat pulldown', base: 100, inc: 5, unit: 'lbs' },
  inclineCurl: { label: 'Incline curl', base: 17.5, inc: 2.5, unit: 'lbs' },
  hammerCurl: { label: 'Hammer curl', base: 17.5, inc: 2.5, unit: 'lbs' },
  cablePullThrough: { label: 'Cable pull-through', base: 80, inc: 10, unit: 'lbs' },
  assistedPullups: { label: 'Assisted pull-ups', base: 75, inc: -5, unit: 'lbs assist' },
}
const TRACKED_ORDER = [
  'hipThrust',
  'romanianDeadlift',
  'bulgarianSplitSquat',
  'cableKickbacks',
  'cableHipAbduction',
  'deadlift',
  'singleArmRow',
  'latPulldown',
  'cableRow',
  'facePulls',
  'benchPress',
  'inclineCurl',
  'hammerCurl',
  'cablePullThrough',
  'assistedPullups',
]

function trackedWeight(key, weightLog) {
  const logged = weightLog[key]
  return logged != null ? logged.weight : TRACKED[key].base
}
function trackedNext(key, weightLog) {
  return trackedWeight(key, weightLog) + TRACKED[key].inc
}
function formatWeight(n, unit) {
  const rounded = Math.round(n * 10) / 10
  return `${rounded}${unit}`
}

/* ----------------------------------------------------------------------- */
/*  Data                                                                    */
/* ----------------------------------------------------------------------- */

const GOALS = [
  'Body recomposition — 142–147 lbs',
  'Glute development — upper glute, minimal quad',
  'First unassisted pull-up',
  'Handstand — wall kick-up stage',
  'Full splits — both sides',
  'Nike Run Club — weekly Wednesday runs',
  '10,000+ steps daily',
  'Anti-inflammatory lifestyle for rosacea',
]

// wrist-sensitive exercise helper — when the injury flag is active these
// get swapped for a grip/wrist-friendly alternative
const w = (name, detail, altName, altDetail) => ({
  name,
  detail,
  wrist: true,
  altName,
  altDetail,
})
const ex = (name, detail) => ({ name, detail })
const rest = (label) => ({ type: 'rest', label })
// a progressively-tracked lift — its "Current"/"Next" weight is computed
// live from the weight log instead of baked into a static detail string
const tracked = (name, repRange, trackKey, extra = {}) => ({
  name,
  repRange,
  trackKey,
  ...extra,
})

const DAYS = [
  {
    id: 'sunday',
    short: 'SUN',
    full: 'Sunday',
    title: 'Push Day + Pull-up Skill',
    equipment: ['Dumbbells', 'Cable machine', 'Pull-up bar', 'Resistance bands'],
    note: 'Own the eccentric on the pull-up negatives — that’s where the strength gets built, not the top.',
    calisthenics: [
      {
        title: 'Calisthenics Strength',
        bodyweight: true,
        meta: NEAR_FAILURE_NOTE,
        items: [
          ex('Wide push-ups', '4x max reps, 3 sec eccentric'),
          ex('Pike push-ups', '4x12'),
          ex('Tricep dips off chair', '3x12'),
          ex('Diamond push-ups', '3x10'),
          ex('Archer push-ups', '3x8 each side'),
          ex('Decline push-ups', '3x12'),
          ex('Pseudo planche lean push-ups', '3x10'),
        ],
      },
    ],
    sections: [
      {
        title: 'Warm-up',
        meta: '5 min',
        items: [
          ex('Arm circles', '10 each direction'),
          ex('Band pull-aparts', '2x15'),
          ex('Scapular retractions', '2x15'),
        ],
      },
      {
        title: 'Superset 1',
        meta: '2 sets to near failure, 30 sec active rest',
        items: [
          tracked('Dumbbell bench press', '5-8 reps', 'benchPress'),
          tracked('Cable row', '5-8 reps', 'cableRow'),
          rest('Jump rope 30 sec'),
        ],
      },
      {
        title: 'Superset 2',
        meta: '2 sets to near failure, 30 sec active rest',
        items: [
          tracked('Single arm dumbbell row', '8-10 reps', 'singleArmRow'),
          tracked('Face pulls', '10-12 reps', 'facePulls'),
          rest('20 high knees'),
        ],
      },
      {
        title: 'Superset 3',
        meta: '2 sets to near failure, 30 sec active rest',
        items: [
          w('Push-ups', '3 sec eccentric to failure · Target 12 clean reps', 'Incline push-ups', '3 sec eccentric on an incline, fists neutral · Target 12 clean reps'),
          w('Pike push-ups', '12 reps with 2 sec hold at bottom', 'Pike shoulder press (light DB)', '12 reps, seated, no wrist loading'),
          rest('10 jumping jacks'),
        ],
      },
      {
        title: 'Pull-up Skill Block',
        meta: 'Non-negotiable order',
        items: [
          ex('Wrist warm-up', '2 min'),
          w('Dead hang', 'Time every set · Target 30 sec minimum', 'Straight-arm band pulldown', 'Time every set · Target 30 sec minimum, no hang'),
          w('Scapular pull-ups', '3x10', 'Scapular shrugs (banded)', '3x10, standing, band anchored high'),
          w('Isometric top hold + negative', '3-5 sec hold, 8-10 sec negative · 5 reps', 'Band-assisted top hold', '3-5 sec hold only, skip loaded negative'),
          tracked('Assisted pull-ups', 'Target 5 reps both sets', 'assistedPullups', {
            prefixWeight: true,
            wrist: true,
            altName: 'Lat pulldown',
            altDetail: '75% bodyweight equivalent · Target 5 reps both sets',
          }),
          ex('Current PR', '1.5 unassisted reps'),
        ],
      },
      {
        title: 'Handstand Skill',
        items: [
          w('Downward dog hold', '3x45 sec', 'Downward dog on forearms', '3x45 sec'),
          w('Dolphin pose', '3x30 sec', null, null),
          w('Pike walk-outs', '3x10', 'Plank walk-outs on forearms', '3x10'),
          w('Crow pose attempts', '5x10 sec hold', null, null),
          w('Feet on wall horizontal plank', '3x20 sec', 'Feet on wall forearm plank', '3x20 sec'),
        ],
      },
      {
        title: 'Core',
        items: [
          w('Ab wheel rollout', '2x10', 'Forearm plank walk-out', '2x10'),
          ex('Hollow body hold', '2x25 sec'),
          w('Hanging knee raise', '2x15', 'Lying knee raise', '2x15'),
          ex('Tuck compression', '2x10'),
        ],
      },
      {
        title: 'Splits Mobility',
        meta: '5 min',
        items: [
          ex('Low lunge hip flexor', '60 sec each side'),
          ex('Pigeon pose', '60 sec each side'),
          ex('Seated hamstring forward fold', '60 sec'),
        ],
      },
    ],
  },
  {
    id: 'monday',
    short: 'MON',
    full: 'Monday',
    title: 'Booty and Abs',
    equipment: ['Barbell', 'Dumbbells', 'Cable machine', 'Resistance bands'],
    note: 'Slow the eccentric on every hip thrust. Speed there is just momentum stealing work from the glute.',
    calisthenics: [
      {
        title: 'Calisthenics Strength',
        bodyweight: true,
        meta: NEAR_FAILURE_NOTE,
        items: [
          ex('Single leg glute bridge', '4x20 each side, 2 sec hold'),
          ex('Bulgarian split squat, bodyweight', '4x12 each side'),
          ex('Donkey kicks', '3x25 each side'),
          ex('Fire hydrants', '3x20 each side'),
          ex('Frog pumps', '3x30'),
          ex('Curtsy lunge', '3x15 each side'),
          ex('Cossack squat', '3x10 each side'),
          ex('Jump squats', '3x15'),
        ],
      },
    ],
    sections: [
      {
        title: 'Activation',
        meta: '5 min, no rest',
        items: [
          ex('Banded clamshells', '2x20 each side'),
          ex('Banded lateral walks', '2x15 each direction'),
          ex('Donkey kicks', '2x15 each side'),
        ],
      },
      {
        title: 'Superset 1',
        meta: '2 sets to near failure, 30 sec active rest',
        items: [
          tracked('Bulgarian split squats', '8 reps each side', 'bulgarianSplitSquat'),
          tracked('Barbell hip thrusts', '8-12 reps', 'hipThrust'),
          rest('Jump rope 30 sec'),
        ],
      },
      {
        title: 'Superset 2',
        meta: '2 sets to near failure, 30 sec active rest',
        items: [
          tracked('Romanian deadlift', '8-10 reps', 'romanianDeadlift', {
            wrist: true,
            altName: 'Romanian deadlift with straps',
            altDetail: 'straps take the grip',
          }),
          tracked('Cable kickbacks', '12-15 reps each side', 'cableKickbacks'),
          rest('20 high knees'),
        ],
      },
      {
        title: 'Superset 3',
        meta: '2 sets to near failure, 30 sec active rest',
        items: [
          tracked('Cable hip abduction', '12-15 reps each side', 'cableHipAbduction'),
          ex('Single leg glute bridge', '15 reps each side · Bodyweight'),
          rest('10 jumping jacks'),
        ],
      },
      {
        title: 'Calisthenics Glute Burnout',
        meta: '2 rounds, no rest',
        items: [
          ex('Donkey kicks', '20 each side'),
          ex('Fire hydrants', '20 each side'),
          ex('Single leg glute bridge', '15 each side'),
        ],
      },
      {
        title: 'Core — Weighted Abs',
        items: [
          ex('Dumbbell Russian twist', '3x15 each side'),
          ex('Weighted sit-up', '3x15'),
          ex('Cable woodchop', '3x12 each side'),
          w('Lying leg raise', '3x15', null, null),
          w('Side plank with hip dip', '3x30 sec each side', 'Side plank with hip dip (forearm)', '3x30 sec each side, resting on forearm'),
        ],
      },
      {
        title: 'Splits Mobility',
        meta: '5 min',
        items: [
          ex('Deep lunge with twist', '60 sec each side'),
          ex('Seated butterfly stretch', '60 sec'),
          ex('Standing hamstring stretch', '60 sec each side'),
        ],
      },
    ],
  },
  {
    id: 'tuesday',
    short: 'TUE',
    full: 'Tuesday',
    title: 'Pull Day + Pull-up Skill',
    equipment: ['Barbell', 'Dumbbells', 'Cable machine', 'Pull-up bar'],
    note: 'Deadlift day feeds the pull-up block — grip is already primed, don’t waste it warming up twice.',
    calisthenics: [
      {
        title: 'Calisthenics Strength',
        bodyweight: true,
        meta: NEAR_FAILURE_NOTE,
        items: [
          ex('Dead hang', '3x max time'),
          ex('Scapular pull-ups', '4x10'),
          ex('Chin-ups', 'Max reps, 3 sets'),
          ex('Inverted rows, under table or bar', '4x12'),
          ex('Negative pull-ups', '3x5, 8 sec controlled descent'),
          ex('Archer pull-ups', '3x5 each side'),
          ex('Band pull-aparts', '3x20'),
          ex('Commando pull-ups', '3x6 each side'),
        ],
      },
    ],
    sections: [
      {
        title: 'Warm-up',
        meta: '5 min',
        items: [
          ex('Arm circles', ''),
          ex('Band pull-aparts', '2x15'),
          ex('Scapular retractions', '2x15'),
        ],
      },
      {
        title: 'Superset 1',
        meta: '2 sets to near failure, 30 sec active rest',
        items: [
          tracked('Deadlift', '5-6 reps', 'deadlift', {
            wrist: true,
            altName: 'Deadlift with straps',
            altDetail: 'straps take the grip',
          }),
          ex('Chest supported dumbbell row', '8-10 reps · Current 35lbs'),
          rest('20 high knees'),
        ],
      },
      {
        title: 'Superset 2',
        meta: '2 sets to near failure, 30 sec active rest',
        items: [
          tracked('Single arm dumbbell row', '8-10 reps', 'singleArmRow'),
          tracked('Lat pulldown', '8-10 reps', 'latPulldown'),
          rest('Jump rope 30 sec'),
        ],
      },
      {
        title: 'Superset 3',
        meta: '2 sets to near failure, 30 sec active rest',
        items: [
          tracked('Face pulls', '10-12 reps', 'facePulls'),
          tracked('Incline dumbbell curl', '8-12 reps', 'inclineCurl', {
            wrist: true,
            altName: 'Incline hammer curl (neutral grip)',
            altDetail: 'neutral wrist',
          }),
          rest('20 high knees'),
        ],
      },
      {
        title: 'Superset 4',
        meta: '2 sets to near failure, 30 sec active rest',
        items: [
          tracked('Hammer curl', '8-12 reps', 'hammerCurl'),
          tracked('Cable row', '5-8 reps', 'cableRow'),
          rest('Jump rope 30 sec'),
        ],
      },
      {
        title: 'Pull-up Skill Block',
        meta: 'Non-negotiable order',
        items: [
          ex('Wrist warm-up', '2 min'),
          w('Dead hang', 'Time every set · Target 30 sec', 'Straight-arm band pulldown', 'Time every set · Target 30 sec, no hang'),
          w('Scapular pull-ups', '3x10', 'Scapular shrugs (banded)', '3x10'),
          w('Isometric top hold + negative', '5 reps', 'Band-assisted top hold', '3-5 sec hold only, skip loaded negative'),
          tracked('Assisted pull-ups', 'Target 5 reps both sets', 'assistedPullups', {
            prefixWeight: true,
            wrist: true,
            altName: 'Lat pulldown',
            altDetail: '75% bodyweight equivalent · Target 5 reps both sets',
          }),
        ],
      },
      {
        title: 'Handstand Skill',
        items: [
          w('Dolphin pose', '3x30 sec', null, null),
          w('Pike walk-outs', '3x10', 'Plank walk-outs on forearms', '3x10'),
          w('Crow pose attempts', '5x10 sec hold', null, null),
          w('Wall kick-ups', '5x10 sec hold', null, null),
        ],
      },
      {
        title: 'Core — Deep Core',
        items: [
          ex('Dead bugs', '3x10 each side'),
          ex('Hollow body hold', '3x25 sec'),
          ex('Copenhagen plank', '3x20 sec each side'),
          ex('Bird dog', '3x10 each side'),
        ],
      },
      {
        title: 'Splits Mobility',
        meta: '5 min',
        items: [
          ex('Half split hold', '45 sec each side'),
          ex('Active hamstring swings', '20 each side'),
          ex('Deep squat hold', '60 sec'),
        ],
      },
    ],
  },
  {
    id: 'wednesday',
    short: 'WED',
    full: 'Wednesday',
    title: 'Nike Run Club + Cardio',
    equipment: ['Running shoes', 'HR monitor'],
    note: 'No lifting. Protect the legs for the run — every uphill gets walked, no negotiating.',
    isCardio: true,
    isRun: true,
    sections: [
      {
        title: 'Morning',
        meta: 'Optional',
        items: [
          ex('Easy incline walk or steps only', '20 min'),
          ex('Heart rate', 'Stays relaxed, no intensity'),
        ],
      },
      {
        title: 'Evening — Nike Run Club',
        items: [
          ex('Group run', '5k'),
          ex('Zone 2 ceiling', '138 bpm strict'),
          ex('Cadence target', '150-155 spm'),
          ex('Uphills', 'Walk every one, no negotiating'),
          ex('Surges', 'None — honour every HR alert'),
        ],
      },
      {
        title: 'Flexibility',
        meta: 'Post-run',
        items: [
          ex('Sun salutation A', 'x3'),
          ex('Pigeon pose', '90 sec each side'),
          ex('Seated forward fold', '90 sec'),
          ex('Supine hamstring stretch', 'Each side'),
          ex('Butterfly stretch', '60 sec'),
        ],
      },
    ],
  },
  {
    id: 'thursday',
    short: 'THU',
    full: 'Thursday',
    title: 'Active Recovery',
    equipment: ['Walking shoes', 'Foam roller'],
    note: 'No gym today. The goal is blood flow, not effort — let the week’s damage actually repair.',
    sections: [
      {
        title: 'Walk',
        items: [
          ex('Easy walk', '30-40 min, flat ground'),
          ex('Heart rate', 'Stays relaxed, conversational pace'),
          ex('Steps', 'Keep chasing the 10k floor, just don’t chase pace'),
        ],
      },
      {
        title: 'Foam Rolling',
        meta: '10 min',
        items: [
          ex('Quads and IT band', '90 sec each side'),
          ex('Glutes', '90 sec each side'),
          ex('Upper back and lats', '90 sec'),
          ex('Calves', '60 sec each side'),
        ],
      },
      {
        title: 'Mobility & Stretch',
        meta: '10 min',
        items: [
          ex('Cat-cow', '10 slow reps'),
          ex('Thread the needle', '45 sec each side'),
          ex('Seated forward fold', '90 sec'),
          ex('Child’s pose', '60 sec'),
        ],
      },
    ],
  },
  {
    id: 'friday',
    short: 'FRI',
    full: 'Friday',
    title: 'Legs',
    equipment: ['Barbell', 'Dumbbells', 'Cable machine', 'Resistance bands'],
    note: 'Heavy squats first, while the legs are freshest. Everything after is in service of that first set.',
    calisthenics: [
      {
        title: 'Calisthenics Strength',
        bodyweight: true,
        meta: NEAR_FAILURE_NOTE,
        items: [
          ex('Jump squats', '4x15'),
          ex('Pistol squat, assisted', '3x8 each side'),
          ex('Bulgarian split squat, bodyweight', '3x12 each side'),
          ex('Cossack squat', '3x10 each side'),
          ex('Reverse nordic curl', '3x8'),
          ex('Single leg deadlift, bodyweight', '3x10 each side'),
          ex('Wall sit', '3x45 sec'),
          ex('Calf raise, bodyweight', '3x25'),
        ],
      },
    ],
    sections: [
      {
        title: 'Activation',
        meta: '5 min',
        items: [
          ex('Banded clamshells', '2x20'),
          ex('Bodyweight squats', '2x10, slow'),
        ],
      },
      {
        title: 'Superset 1',
        meta: '2 sets to near failure, 30 sec active rest',
        items: [
          ex('Barbell back squat', '5-8 reps, heavy'),
          ex('Jump squats', '10 reps, explosive'),
          rest('20 high knees'),
        ],
      },
      {
        title: 'Superset 2',
        meta: '2 sets to near failure, 30 sec active rest',
        items: [
          tracked('Bulgarian split squat', '8 reps each side', 'bulgarianSplitSquat'),
          ex('Deficit step-ups', '10 reps each leg · Current 15lbs'),
          rest('Jump rope 30 sec'),
        ],
      },
      {
        title: 'Superset 3',
        meta: '2 sets to near failure, 30 sec active rest',
        items: [
          tracked('Cable pull-through', '12 reps', 'cablePullThrough'),
          ex('Standing calf raise', '15 reps · Current 15lb plate'),
          rest('20 high knees'),
        ],
      },
      {
        title: 'Calisthenics Lower Body',
        items: [
          ex('Single leg deadlift', '3x10 each side, bodyweight'),
          ex('Pistol squat, assisted', '3x5 each side'),
          ex('Copenhagen plank', '3x20 sec each side'),
        ],
      },
      {
        title: 'Core — Calisthenics',
        items: [
          w('Ab wheel rollout', '2x10', 'Forearm plank walk-out', '2x10'),
          ex('Hollow body hold', '2x25 sec'),
          w('Hanging knee raise', '2x15', 'Lying knee raise', '2x15'),
          w('Dragon flag negative', '2x5', 'Reverse crunch', '2x8'),
          w('L-sit hold', '2x10 sec', 'Tuck hold, feet on floor', '2x10 sec'),
        ],
      },
      {
        title: 'Splits Mobility',
        meta: '5 min',
        items: [
          ex('Deep squat hold', '60 sec'),
          ex('Half split hold', '45 sec each side'),
          ex('Active hamstring swings', '20 each side'),
        ],
      },
    ],
  },
  {
    id: 'saturday',
    short: 'SAT',
    full: 'Saturday',
    title: 'Zone 2 Run + Yoga',
    equipment: ['Running shoes', 'HR monitor', 'Yoga mat'],
    note: 'Zone 2 stays Zone 2 — if the watch buzzes, you’re running someone else’s workout.',
    isRun: true,
    sections: [
      {
        title: 'Zone 2 Run',
        items: [
          ex('Run', '30-40 min, Lady Bird Lake or flat route'),
          ex('Zone 2 ceiling', '138 bpm strict'),
          ex('Cadence target', '150-155 spm'),
          ex('Effort', 'Conversational the whole way — if you can’t talk, slow down'),
        ],
      },
      {
        title: 'Yoga Flow',
        meta: 'Post-run',
        items: [
          ex('Sun salutation A', 'x5'),
          ex('Downward dog hold', '3x45 sec'),
          ex('Pigeon pose', '90 sec each side'),
          ex('Standing split attempt', '30 sec each side'),
          ex('Seated forward fold', '90 sec'),
          ex('Legs up the wall', '5 min'),
        ],
      },
    ],
  },
]

// swaps a day's "Superset N" strength sections for its calisthenics block
// (in place, so warm-up/skill/core/mobility sections keep their position)
function getDaySections(day, mode) {
  if (mode !== 'calisthenics' || !day.calisthenics) return day.sections

  const isSuperset = (title) => title.startsWith('Superset')
  const kept = day.sections.filter((s) => !isSuperset(s.title))
  const firstSupersetIdx = day.sections.findIndex((s) => isSuperset(s.title))
  const insertAt =
    firstSupersetIdx === -1
      ? 0
      : day.sections.slice(0, firstSupersetIdx).filter((s) => !isSuperset(s.title)).length

  return [...kept.slice(0, insertAt), ...day.calisthenics, ...kept.slice(insertAt)]
}

const BIOMETRIC_RULES = [
  {
    title: 'Body Battery',
    source: 'Garmin',
    levels: [
      { range: '80–100', action: 'Full session, full volume' },
      { range: '60–80', action: 'Full session, reduce cardio finisher' },
      { range: '50–60', action: 'Modify — drop one set per exercise, skip finisher' },
      { range: '30–50', action: 'Short session — primary block only, no finisher, no skill work' },
      { range: 'Below 30', action: 'Active recovery only — walk and mobility, no gym' },
    ],
  },
  {
    title: 'HRV Status',
    source: 'Garmin',
    levels: [
      { range: 'Green · Balanced', action: 'Train as planned' },
      { range: 'Orange · Unbalanced', action: 'Reduce load 15–20%' },
      { range: 'Red · Low', action: 'Active recovery only' },
    ],
  },
  {
    title: 'Oura Readiness',
    source: 'Oura',
    levels: [
      { range: 'Above 85', action: 'Full session' },
      { range: '70–85', action: 'Moderate session' },
      { range: 'Below 70', action: 'Downgrade one level' },
    ],
  },
]

/* ----------------------------------------------------------------------- */
/*  Small presentational pieces                                            */
/* ----------------------------------------------------------------------- */

function GoalsRibbon() {
  return (
    <div className="border-b border-forest-canopy/40 bg-forest-deep">
      <div
        className="no-scrollbar flex gap-2 overflow-x-auto px-5 py-3 sm:px-8"
        style={{ scrollSnapType: 'x proximity' }}
      >
        {GOALS.map((goal) => (
          <span
            key={goal}
            className="shrink-0 whitespace-nowrap rounded-full border border-fern/30 bg-forest-mid/60 px-4 py-1.5 font-body text-[11px] uppercase tracking-wide text-cream"
            style={{ scrollSnapAlign: 'start' }}
          >
            {goal}
          </span>
        ))}
      </div>
    </div>
  )
}

function DaySelector({ days, activeId, onSelect }) {
  return (
    <div className="border-b border-forest-canopy/40 bg-forest-deep px-5 sm:px-8">
      <div className="no-scrollbar flex gap-6 overflow-x-auto">
        {days.map((day) => {
          const isActive = day.id === activeId
          return (
            <button
              key={day.id}
              onClick={() => onSelect(day.id)}
              className="relative shrink-0 py-4 text-left font-body text-xs uppercase tracking-[0.15em] transition-colors"
              style={{ color: isActive ? '#F2EDE4' : '#7A9E7E' }}
            >
              {day.short}
              <span
                className="absolute inset-x-0 -bottom-px h-[2px] rounded-full transition-opacity"
                style={{
                  backgroundColor: '#C9A96E',
                  opacity: isActive ? 1 : 0,
                }}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ModeToggle({ mode, onToggle }) {
  const active = mode === 'calisthenics'
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between border-b border-forest-canopy/40 bg-forest-deep px-5 py-3 text-left sm:px-8"
    >
      <span className="pr-3">
        <span className="block font-body text-xs uppercase tracking-wide text-cream">
          Calisthenics Week
        </span>
        <span className="block font-body text-[11px] text-sage">
          {active ? 'Calisthenics mode' : 'Weights mode'}
        </span>
      </span>
      <span
        className="relative h-5 w-9 shrink-0 rounded-full transition-colors"
        style={{ backgroundColor: active ? 'rgba(201,169,110,0.35)' : '#1C2B1E' }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full transition-transform"
          style={{
            backgroundColor: active ? '#C9A96E' : '#7A9E7E',
            transform: active ? 'translateX(18px)' : 'translateX(2px)',
          }}
        />
      </span>
    </button>
  )
}

function DayModeToggle({ active, disabled, onToggle }) {
  return (
    <button
      onClick={disabled ? undefined : onToggle}
      disabled={disabled}
      className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors sm:w-auto sm:min-w-[280px]"
      style={{
        borderColor: active ? '#C9A96E' : 'rgba(168,197,160,0.25)',
        backgroundColor: active ? 'rgba(201,169,110,0.1)' : 'rgba(45,74,48,0.4)',
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <span className="pr-3">
        <span className="block font-body text-xs uppercase tracking-wide text-cream">
          This day
        </span>
        <span className="block font-body text-[11px] text-sage">
          {disabled
            ? 'Set by Calisthenics Week above'
            : active
            ? 'Calisthenics mode'
            : 'Weights mode'}
        </span>
      </span>
      <span
        className="relative h-5 w-9 shrink-0 rounded-full transition-colors"
        style={{ backgroundColor: active ? '#C9A96E' : '#3D6B42' }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-ivory transition-transform"
          style={{ transform: active ? 'translateX(18px)' : 'translateX(2px)' }}
        />
      </span>
    </button>
  )
}

function WeightLogInput({ trackKey, suggested, unit, lastLoggedAt, onLog }) {
  const [value, setValue] = useState('')
  const submit = () => {
    const num = parseFloat(value)
    if (!Number.isNaN(num)) {
      onLog(trackKey, num)
      setValue('')
    }
  }
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2">
      <input
        type="number"
        inputMode="decimal"
        step="2.5"
        placeholder={`${suggested}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        className="w-16 rounded border border-fern/25 bg-forest-deep/60 px-2 py-1 font-body text-[13px] text-ivory placeholder:text-sage/50 focus:border-gold focus:outline-none"
      />
      <span className="font-body text-[10px] uppercase tracking-wide text-sage">{unit}</span>
      <button
        onClick={submit}
        className="rounded-full border border-gold/50 px-2.5 py-1 font-body text-[10px] uppercase tracking-wide text-gold"
      >
        Log
      </button>
      {lastLoggedAt && (
        <span className="font-body text-[10px] text-sage">Logged {lastLoggedAt}</span>
      )}
    </div>
  )
}

function RepLogInput({ repKey, lastReps, lastLoggedAt, onLog }) {
  const [value, setValue] = useState('')
  const submit = () => {
    const num = parseInt(value, 10)
    if (!Number.isNaN(num) && num > 0) {
      onLog(repKey, num)
      setValue('')
    }
  }
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2">
      <input
        type="number"
        inputMode="numeric"
        step="1"
        placeholder={lastReps != null ? `${lastReps}` : 'reps'}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        className="w-16 rounded border border-fern/25 bg-forest-deep/60 px-2 py-1 font-body text-[13px] text-ivory placeholder:text-sage/50 focus:border-gold focus:outline-none"
      />
      <span className="font-body text-[10px] uppercase tracking-wide text-sage">reps</span>
      <button
        onClick={submit}
        className="rounded-full border border-gold/50 px-2.5 py-1 font-body text-[10px] uppercase tracking-wide text-gold"
      >
        Log
      </button>
      {lastReps != null && (
        <span className="font-body text-[10px] text-sage">
          PR {lastReps} ({lastLoggedAt})
        </span>
      )}
    </div>
  )
}

function ExerciseRow({ item, weightLog, onLogWeight, trackReps, repLog, onLogReps }) {
  if (item.type === 'rest') {
    return (
      <li className="flex items-center gap-2 py-1.5 font-body text-[13px] italic text-sage">
        <span aria-hidden>↻</span>
        {item.label}
      </li>
    )
  }

  const trackedMeta = item.trackKey ? TRACKED[item.trackKey] : null
  const current = trackedMeta ? trackedWeight(item.trackKey, weightLog) : null
  const next = trackedMeta ? trackedNext(item.trackKey, weightLog) : null
  const detail = trackedMeta
    ? item.prefixWeight
      ? `${formatWeight(current, trackedMeta.unit)} · ${item.repRange}`
      : `${item.repRange} · Current ${formatWeight(current, trackedMeta.unit)} · Next ${formatWeight(next, trackedMeta.unit)}`
    : item.detail

  const repKey = trackReps && !trackedMeta ? slugify(item.name) : null

  return (
    <li className="flex items-start justify-between gap-3 border-b border-fern/10 py-2.5 last:border-none">
      <div className="w-full">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-body text-[15px] text-ivory">{item.name}</span>
          {item.wrist && (
            <span
              className="rounded-full px-2 py-0.5 font-body text-[9px] uppercase tracking-wide text-gold"
              style={{ backgroundColor: 'rgba(201,169,110,0.15)' }}
            >
              Wrist load
            </span>
          )}
        </div>
        {detail && <div className="mt-0.5 font-body text-[13px] text-sage">{detail}</div>}
        {trackedMeta && (
          <WeightLogInput
            trackKey={item.trackKey}
            suggested={next}
            unit={trackedMeta.unit}
            lastLoggedAt={weightLog[item.trackKey]?.loggedAt}
            onLog={onLogWeight}
          />
        )}
        {repKey && (
          <RepLogInput
            repKey={repKey}
            lastReps={repLog[repKey]?.reps ?? null}
            lastLoggedAt={repLog[repKey]?.loggedAt}
            onLog={onLogReps}
          />
        )}
      </div>
    </li>
  )
}

function Section({ section, defaultOpen, weightLog, onLogWeight, repLog, onLogReps }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div
      className={`border-b border-fern/10 last:border-none ${
        section.bodyweight ? 'border-l-2 border-l-gold/50 pl-3' : ''
      }`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 py-4 text-left"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-xl italic text-gold">{section.title}</h3>
            {section.bodyweight && (
              <span className="rounded-full bg-gold px-2 py-0.5 font-body text-[9px] uppercase tracking-wide text-forest-deep">
                Bodyweight
              </span>
            )}
          </div>
          {section.meta &&
            (section.bodyweight ? (
              <p className="mt-1 font-body text-[13px] italic text-sage">{section.meta}</p>
            ) : (
              <p className="mt-0.5 font-body text-[11px] uppercase tracking-wide text-sage">
                {section.meta}
              </p>
            ))}
        </div>
        <span
          className="font-display text-2xl text-fern transition-transform"
          style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          +
        </span>
      </button>
      {open && (
        <ul className="day-reveal pb-4">
          {section.items.map((item, i) => (
            <ExerciseRow
              key={i}
              item={item}
              weightLog={weightLog}
              onLogWeight={onLogWeight}
              trackReps={section.bodyweight}
              repLog={repLog}
              onLogReps={onLogReps}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function WorkoutCard({
  day,
  mode,
  globalActive,
  onToggleDay,
  weightLog,
  onLogWeight,
  runLog,
  onLogRun,
  repLog,
  onLogReps,
}) {
  const sections = getDaySections(day, mode)
  return (
    <div
      key={day.id}
      className="day-reveal rounded-2xl border border-fern/15 bg-forest-mid/60 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.25)] sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-body text-xs uppercase tracking-[0.2em] text-gold">{day.full}</p>
          <h2 className="mt-1 font-display text-3xl font-medium text-ivory sm:text-4xl">
            {day.title}
          </h2>
        </div>
      </div>

      <p className="mt-4 border-l-2 border-gold/60 pl-3 font-display text-lg italic text-cream">
        {day.note}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {day.equipment.map((eq) => (
          <span
            key={eq}
            className="rounded-full border border-sage/30 px-3 py-1 font-body text-[11px] text-sage"
          >
            {eq}
          </span>
        ))}
      </div>

      {day.calisthenics && (
        <div className="mt-4">
          <DayModeToggle
            active={mode === 'calisthenics'}
            disabled={globalActive}
            onToggle={onToggleDay}
          />
        </div>
      )}

      {day.isRun && (
        <RunLogPanel
          dayId={day.id}
          entries={runLog.filter((r) => r.dayId === day.id)}
          onLogRun={onLogRun}
        />
      )}

      <div className="mt-5">
        {sections.map((section, i) => (
          <Section
            key={section.title}
            section={section}
            defaultOpen={i === 0}
            weightLog={weightLog}
            onLogWeight={onLogWeight}
            repLog={repLog}
            onLogReps={onLogReps}
          />
        ))}
      </div>
    </div>
  )
}

function RunLogPanel({ dayId, entries, onLogRun }) {
  const [distance, setDistance] = useState('')
  const [duration, setDuration] = useState('')
  const [avgHr, setAvgHr] = useState('')

  const submit = () => {
    const d = parseFloat(distance)
    const t = parseFloat(duration)
    if (Number.isNaN(d) || Number.isNaN(t) || d <= 0 || t <= 0) return
    onLogRun(dayId, { distance: d, duration: t, avgHr: avgHr ? parseInt(avgHr, 10) : null })
    setDistance('')
    setDuration('')
    setAvgHr('')
  }

  return (
    <div className="mt-4 rounded-lg border border-fern/20 bg-forest-deep/40 p-4">
      <p className="font-body text-xs uppercase tracking-wide text-cream">Running log</p>
      <p className="mt-0.5 font-body text-[11px] text-sage">
        Log today’s run to track pace and effort over time.
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="font-body text-[10px] uppercase tracking-wide text-sage">Miles</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder="3.1"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className="w-16 rounded border border-fern/25 bg-forest-deep/60 px-2 py-1 font-body text-[13px] text-ivory placeholder:text-sage/50 focus:border-gold focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-body text-[10px] uppercase tracking-wide text-sage">Minutes</span>
          <input
            type="number"
            inputMode="decimal"
            step="1"
            placeholder="32"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-16 rounded border border-fern/25 bg-forest-deep/60 px-2 py-1 font-body text-[13px] text-ivory placeholder:text-sage/50 focus:border-gold focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-body text-[10px] uppercase tracking-wide text-sage">Avg HR</span>
          <input
            type="number"
            inputMode="numeric"
            step="1"
            placeholder="138"
            value={avgHr}
            onChange={(e) => setAvgHr(e.target.value)}
            className="w-16 rounded border border-fern/25 bg-forest-deep/60 px-2 py-1 font-body text-[13px] text-ivory placeholder:text-sage/50 focus:border-gold focus:outline-none"
          />
        </label>
        <button
          onClick={submit}
          className="rounded-full border border-gold/50 px-3 py-1.5 font-body text-[11px] uppercase tracking-wide text-gold"
        >
          Log run
        </button>
      </div>

      {entries.length > 0 && (
        <ul className="mt-4 space-y-2">
          {entries
            .slice()
            .reverse()
            .map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-t border-fern/10 pt-2 font-body text-[13px]"
              >
                <span className="text-ivory">{entry.date}</span>
                <span className="text-sage">{entry.distance} mi</span>
                <span className="text-sage">{entry.duration} min</span>
                <span className="font-medium text-gold">
                  {formatPace(entry.duration, entry.distance)}
                </span>
                {entry.avgHr && <span className="text-sage">{entry.avgHr} bpm avg</span>}
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}

function BiometricPanel() {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl border border-fern/15 bg-forest-mid/60 p-5 sm:p-8">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 text-left">
        <div>
          <p className="font-body text-xs uppercase tracking-[0.2em] text-gold">Before you start</p>
          <h2 className="mt-1 font-display text-2xl font-medium text-ivory sm:text-3xl">
            Biometric check
          </h2>
        </div>
        <span
          className="font-display text-3xl text-fern transition-transform"
          style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          +
        </span>
      </button>
      {open && (
        <div className="day-reveal mt-5 grid gap-6 sm:grid-cols-3">
          {BIOMETRIC_RULES.map((rule) => (
            <div key={rule.title}>
              <h3 className="font-display text-lg italic text-gold">{rule.title}</h3>
              <p className="font-body text-[11px] uppercase tracking-wide text-sage">{rule.source}</p>
              <ul className="mt-3 space-y-2.5">
                {rule.levels.map((lvl) => (
                  <li key={lvl.range} className="border-b border-fern/10 pb-2.5 last:border-none">
                    <div className="font-body text-[13px] font-medium text-ivory">{lvl.range}</div>
                    <div className="font-body text-[13px] text-sage">{lvl.action}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function OverloadTable({ weightLog }) {
  return (
    <div className="rounded-2xl border border-fern/15 bg-forest-mid/60 p-5 sm:p-8">
      <p className="font-body text-xs uppercase tracking-[0.2em] text-gold">Reference</p>
      <h2 className="mt-1 font-display text-2xl font-medium text-ivory sm:text-3xl">
        Progressive overload log
      </h2>
      <p className="mt-1 font-body text-[13px] text-sage">
        Updates as you log weights during a workout.
      </p>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[320px] border-collapse font-body text-[13px] sm:text-sm">
          <thead>
            <tr className="border-b border-fern/25 text-left text-[10px] uppercase tracking-wide text-sage sm:text-[11px]">
              <th className="py-2 pr-2 font-medium">Exercise</th>
              <th className="py-2 pr-2 font-medium">Current</th>
              <th className="py-2 font-medium">Next</th>
            </tr>
          </thead>
          <tbody>
            {TRACKED_ORDER.map((key) => {
              const meta = TRACKED[key]
              return (
                <tr key={key} className="border-b border-fern/10 last:border-none">
                  <td className="py-2.5 pr-2 text-ivory">{meta.label}</td>
                  <td className="py-2.5 pr-2 whitespace-nowrap text-sage">
                    {formatWeight(trackedWeight(key, weightLog), meta.unit)}
                  </td>
                  <td className="py-2.5 whitespace-nowrap font-medium text-gold">
                    {formatWeight(trackedNext(key, weightLog), meta.unit)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------------- */
/*  App                                                                     */
/* ----------------------------------------------------------------------- */

function todayLabel(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

export default function App() {
  const todayId = DAYS[new Date().getDay()].id
  const [activeId, setActiveId] = useState(todayId)
  const [mode, setMode] = useState(() => {
    if (typeof window === 'undefined') return 'weights'
    return localStorage.getItem(TRAINING_MODE_KEY) === 'calisthenics' ? 'calisthenics' : 'weights'
  })
  const [dayModes, setDayModes] = useState(() => {
    if (typeof window === 'undefined') return DAYS.map(() => 'weights')
    return DAYS.map((_, i) =>
      localStorage.getItem(`${DAY_MODE_KEY_PREFIX}${i}`) === 'calisthenics' ? 'calisthenics' : 'weights'
    )
  })
  const [now, setNow] = useState(() => new Date())
  const [weightLog, setWeightLog] = useState(() => {
    if (typeof window === 'undefined') return {}
    try {
      return JSON.parse(localStorage.getItem(WEIGHT_LOG_KEY)) || {}
    } catch {
      return {}
    }
  })
  const [runLog, setRunLog] = useState(() => {
    if (typeof window === 'undefined') return []
    try {
      return JSON.parse(localStorage.getItem(RUN_LOG_KEY)) || []
    } catch {
      return []
    }
  })
  const [repLog, setRepLog] = useState(() => {
    if (typeof window === 'undefined') return {}
    try {
      return JSON.parse(localStorage.getItem(REP_LOG_KEY)) || {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    localStorage.setItem(TRAINING_MODE_KEY, mode)
    document.body.classList.toggle('calisthenics-mode', mode === 'calisthenics')
  }, [mode])

  useEffect(() => {
    dayModes.forEach((m, i) => localStorage.setItem(`${DAY_MODE_KEY_PREFIX}${i}`, m))
  }, [dayModes])

  useEffect(() => {
    localStorage.setItem(WEIGHT_LOG_KEY, JSON.stringify(weightLog))
  }, [weightLog])

  useEffect(() => {
    localStorage.setItem(RUN_LOG_KEY, JSON.stringify(runLog))
  }, [runLog])

  useEffect(() => {
    localStorage.setItem(REP_LOG_KEY, JSON.stringify(repLog))
  }, [repLog])

  const activeDayIndex = useMemo(() => DAYS.findIndex((d) => d.id === activeId), [activeId])
  const activeDay = DAYS[activeDayIndex]
  const globalActive = mode === 'calisthenics'
  const effectiveMode = globalActive ? 'calisthenics' : dayModes[activeDayIndex]

  const toggleDayMode = () => {
    setDayModes((prev) => {
      const next = [...prev]
      next[activeDayIndex] = next[activeDayIndex] === 'weights' ? 'calisthenics' : 'weights'
      return next
    })
  }

  const logWeight = (key, weight) => {
    setWeightLog((prev) => ({
      ...prev,
      [key]: { weight, loggedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
    }))
  }

  const logRun = (dayId, entry) => {
    setRunLog((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        dayId,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ...entry,
      },
    ])
  }

  const logReps = (key, reps) => {
    setRepLog((prev) => ({
      ...prev,
      [key]: { reps, loggedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
    }))
  }

  return (
    <div className="min-h-screen bg-forest-deep font-body text-ivory">
      <header className="border-b border-forest-canopy/40 px-5 py-6 sm:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="font-display text-2xl font-semibold tracking-[0.25em] text-ivory">
            MADELEINE
          </h1>
          <span className="font-body text-xs uppercase tracking-wide text-sage">{todayLabel(now)}</span>
        </div>
      </header>

      <GoalsRibbon />
      <ModeToggle mode={mode} onToggle={() => setMode((m) => (m === 'weights' ? 'calisthenics' : 'weights'))} />
      <DaySelector days={DAYS} activeId={activeId} onSelect={setActiveId} />

      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-6 sm:px-8 sm:py-10">
        <WorkoutCard
          day={activeDay}
          mode={effectiveMode}
          globalActive={globalActive}
          onToggleDay={toggleDayMode}
          weightLog={weightLog}
          onLogWeight={logWeight}
          runLog={runLog}
          onLogRun={logRun}
          repLog={repLog}
          onLogReps={logReps}
        />
        <BiometricPanel />
        {effectiveMode === 'weights' && <OverloadTable weightLog={weightLog} />}
      </main>

      <footer className="px-5 py-8 text-center font-body text-[11px] uppercase tracking-widest text-sage sm:px-8">
        Train with intention.
      </footer>
    </div>
  )
}
