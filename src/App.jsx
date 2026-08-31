import React, { useMemo, useState } from 'react'

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

const DAYS = [
  {
    id: 'sunday',
    short: 'SUN',
    full: 'Sunday',
    title: 'Chest, Shoulders + Pull-up Skill',
    equipment: ['Dumbbells', 'Cable machine', 'Pull-up bar', 'Resistance bands'],
    note: 'Own the eccentric on the pull-up negatives — that’s where the strength gets built, not the top.',
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
          ex('Dumbbell bench press', '5-8 reps · Current 35lbs · Next 37.5lbs'),
          ex('Cable row', '5-8 reps · Current 100lbs · Next 105lbs'),
          rest('Jump rope 30 sec'),
        ],
      },
      {
        title: 'Superset 2',
        meta: '2 sets to near failure, 30 sec active rest',
        items: [
          ex('Single arm dumbbell row', '8-10 reps · Current 35lbs · Next 37.5lbs'),
          ex('Face pulls', '10-12 reps · Current 80lbs · Next 85lbs'),
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
          w('Assisted pull-ups', '75lbs assist · Target 5 reps both sets', 'Lat pulldown', '75% bodyweight equivalent · Target 5 reps both sets'),
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
          ex('Bulgarian split squats', '8 reps each side · Current 20lbs · Next 25lbs'),
          ex('Barbell hip thrusts', '8-12 reps · Current 90lbs · Next 100lbs'),
          rest('Jump rope 30 sec'),
        ],
      },
      {
        title: 'Superset 2',
        meta: '2 sets to near failure, 30 sec active rest',
        items: [
          w('Romanian deadlift', '8-10 reps · Current 60lbs', 'Romanian deadlift with straps', '8-10 reps · Current 60lbs, straps take the grip'),
          ex('Cable kickbacks', '12-15 reps each side · Current 80lbs · Next 85lbs'),
          rest('20 high knees'),
        ],
      },
      {
        title: 'Superset 3',
        meta: '2 sets to near failure, 30 sec active rest',
        items: [
          ex('Cable hip abduction', '12-15 reps each side · Current 70lbs'),
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
    title: 'Biceps and Shoulders',
    equipment: ['Dumbbells', 'Cable machine'],
    note: 'Curls are a wrist-heavy day — check in with the flag below before you load up.',
    sections: [
      {
        title: 'Superset 1',
        meta: '2 sets to near failure, 30 sec active rest',
        items: [
          w('Incline dumbbell curl', '8-12 reps · Current 17.5lbs · Next 20lbs', 'Incline hammer curl (neutral grip)', '8-12 reps · Current 17.5lbs · Next 20lbs, neutral wrist'),
          ex('Lateral raise', '10-12 reps · Current 12.5lbs · Next 15lbs'),
          rest('20 high knees'),
        ],
      },
      {
        title: 'Superset 2',
        meta: '2 sets to near failure, 30 sec active rest',
        items: [
          w('Hammer curl', '8-12 reps · Current 17.5lbs · Next 20lbs', null, null),
          ex('Arnold press', '8-10 reps · Current 20lbs · Next 22.5lbs'),
          rest('Jump rope 30 sec'),
        ],
      },
      {
        title: 'Superset 3',
        meta: '2 sets to near failure, 30 sec active rest',
        items: [
          w('Concentration curl', '10 reps each side', null, null),
          ex('Front raise', '10-12 reps · Current 10lbs'),
          rest('20 high knees'),
        ],
      },
      {
        title: 'Handstand Skill',
        items: [
          ex('Wrist warm-up', '2 min'),
          w('Dolphin pose', '3x30 sec', null, null),
          w('Pike walk-outs', '3x10', 'Plank walk-outs on forearms', '3x10'),
          w('Crow pose attempts', '5x10 sec hold', null, null),
          w('Wall kick-ups', '5x10 sec hold', null, null),
        ],
      },
      {
        title: 'Core — Six Pack Focus',
        items: [
          ex('Bicycle crunch', '3x20 each side, slow'),
          w('Lying leg raise', '3x15', null, null),
          ex('Reverse crunch', '3x15'),
          w('Plank shoulder taps', '3x15 each side', 'Forearm plank shoulder taps', '3x15 each side, on forearms'),
        ],
      },
      {
        title: 'Splits Mobility',
        meta: '5 min',
        items: [
          ex('Hip flexor kneeling stretch', '60 sec each side'),
          ex('Figure four stretch', '60 sec each side'),
          ex('Standing quad stretch', '30 sec each side'),
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
    title: 'Back and Lats + Pull-up Skill',
    equipment: ['Barbell', 'Dumbbells', 'Cable machine', 'Pull-up bar'],
    note: 'Deadlift day feeds the pull-up block — grip is already primed, don’t waste it warming up twice.',
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
          w('Deadlift', '5-6 reps · Current 135lbs · Next 145lbs', 'Deadlift with straps', '5-6 reps · Current 135lbs · Next 145lbs, straps take the grip'),
          ex('Chest supported dumbbell row', '8-10 reps · Current 35lbs'),
          rest('20 high knees'),
        ],
      },
      {
        title: 'Superset 2',
        meta: '2 sets to near failure, 30 sec active rest',
        items: [
          ex('Single arm dumbbell row', '8-10 reps · Current 35lbs · Next 37.5lbs'),
          ex('Lat pulldown', '8-10 reps · Current 100lbs · Next 105lbs'),
          rest('Jump rope 30 sec'),
        ],
      },
      {
        title: 'Superset 3',
        meta: '2 sets to near failure, 30 sec active rest',
        items: [
          ex('Face pulls', '10-12 reps · Current 80lbs · Next 85lbs'),
          w('Scapular pull-ups', '3x10', 'Scapular shrugs (banded)', '3x10, standing, band anchored high'),
          rest('20 high knees'),
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
          w('Assisted pull-ups', '75lbs assist · Target 5 reps both sets', 'Lat pulldown', '75% bodyweight equivalent · Target 5 reps both sets'),
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
    id: 'friday',
    short: 'FRI',
    full: 'Friday',
    title: 'Legs',
    equipment: ['Barbell', 'Dumbbells', 'Cable machine', 'Resistance bands'],
    note: 'Heavy squats first, while the legs are freshest. Everything after is in service of that first set.',
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
          ex('Bulgarian split squat', '8 reps each side · Current 20lbs'),
          ex('Deficit step-ups', '10 reps each leg · Current 15lbs'),
          rest('Jump rope 30 sec'),
        ],
      },
      {
        title: 'Superset 3',
        meta: '2 sets to near failure, 30 sec active rest',
        items: [
          ex('Cable pull-through', '12 reps · Current 80lbs · Next 90lbs'),
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
    title: 'Full Body + Cardio',
    equipment: ['Barbell', 'Dumbbells', 'Cable machine', 'Treadmill'],
    note: 'Longest session of the week — pace the four supersets, the finisher is where the week gets paid off.',
    sections: [
      {
        title: 'Superset 1',
        meta: '2 sets to near failure, 30 sec active rest',
        items: [
          ex('Barbell hip thrusts', '8-12 reps · Current 90lbs'),
          ex('Dumbbell bench press', '5-8 reps · Current 35lbs'),
          rest('Jump rope 30 sec'),
        ],
      },
      {
        title: 'Superset 2',
        meta: '2 sets to near failure, 30 sec active rest',
        items: [
          w('Romanian deadlift', '8-10 reps', 'Romanian deadlift with straps', '8-10 reps, straps take the grip'),
          ex('Cable row', '5-8 reps · Current 100lbs'),
          rest('20 high knees'),
        ],
      },
      {
        title: 'Superset 3',
        meta: '2 sets to near failure, 30 sec active rest',
        items: [
          ex('Bulgarian split squat', '8 reps each side'),
          ex('Single arm dumbbell row', '8-10 reps · Current 35lbs'),
          rest('10 jumping jacks'),
        ],
      },
      {
        title: 'Superset 4',
        meta: '2 sets to near failure, 30 sec active rest',
        items: [
          ex('Arnold press', '8-10 reps · Current 20lbs'),
          ex('Lateral raise', '10-12 reps · Current 12.5lbs'),
          rest('20 high knees'),
        ],
      },
      {
        title: 'Calisthenics Core Circuit',
        meta: '2 rounds',
        items: [
          w('Ab wheel rollout', 'x10', 'Forearm plank walk-out', 'x10'),
          ex('Hollow body hold', 'x25 sec'),
          w('Hanging knee raise', 'x15', 'Lying knee raise', 'x15'),
          ex('Bicycle crunch', 'x20 each side'),
          w('Crow pose attempts', '5x10 sec', null, null),
          ex('Tuck compression', 'x10'),
        ],
      },
      {
        title: 'Cardio Finisher',
        items: [
          ex('Incline treadmill walk', '20 min · 8-10% incline · 3.0-3.5 mph'),
          ex('Or Lady Bird Lake Zone 2 run', '30 min'),
        ],
      },
      {
        title: 'Splits Mobility',
        meta: '5 min',
        items: [
          ex('Full pigeon pose', '90 sec each side'),
          ex('Standing split attempt', '30 sec each side'),
          ex('Seated straddle stretch', '60 sec'),
        ],
      },
    ],
  },
]

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

const OVERLOAD_LOG = [
  { exercise: 'Barbell hip thrusts', current: '90lbs', next: '100lbs' },
  { exercise: 'Romanian deadlift', current: '60lbs', next: '65lbs' },
  { exercise: 'Bulgarian split squat', current: '20lbs', next: '25lbs' },
  { exercise: 'Cable kickbacks', current: '80lbs', next: '85lbs' },
  { exercise: 'Cable hip abduction', current: '70lbs', next: '75lbs' },
  { exercise: 'Deadlift', current: '135lbs', next: '145lbs' },
  { exercise: 'Single arm row', current: '35lbs', next: '37.5lbs' },
  { exercise: 'Lat pulldown', current: '100lbs', next: '105lbs' },
  { exercise: 'Cable row', current: '100lbs', next: '105lbs' },
  { exercise: 'Face pulls', current: '80lbs', next: '85lbs' },
  { exercise: 'Dumbbell bench press', current: '35lbs', next: '37.5lbs' },
  { exercise: 'Arnold press', current: '20lbs', next: '22.5lbs' },
  { exercise: 'Lateral raise', current: '12.5lbs', next: '15lbs' },
  { exercise: 'Incline curl', current: '17.5lbs', next: '20lbs' },
  { exercise: 'Hammer curl', current: '17.5lbs', next: '20lbs' },
  { exercise: 'Cable pull-through', current: '80lbs', next: '90lbs' },
  { exercise: 'Assisted pull-ups', current: '75lbs assist', next: '70lbs assist' },
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

function WristToggle({ active, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors sm:w-auto sm:min-w-[280px]"
      style={{
        borderColor: active ? '#C9A96E' : 'rgba(168,197,160,0.25)',
        backgroundColor: active ? 'rgba(201,169,110,0.1)' : 'rgba(45,74,48,0.4)',
      }}
    >
      <span className="pr-3">
        <span className="block font-body text-xs uppercase tracking-wide text-cream">
          Wrist flag
        </span>
        <span className="block font-body text-[11px] text-sage">
          {active ? 'Grip-loading exercises swapped' : 'Tap on if the wrist is bothering you'}
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

function ExerciseRow({ item, wristFlag }) {
  if (item.type === 'rest') {
    return (
      <li className="flex items-center gap-2 py-1.5 font-body text-[13px] italic text-sage">
        <span aria-hidden>↻</span>
        {item.label}
      </li>
    )
  }

  const showAlt = wristFlag && item.wrist && (item.altName || item.altDetail)
  const displayName = showAlt && item.altName ? item.altName : item.name
  const displayDetail = showAlt && item.altDetail ? item.altDetail : item.detail

  return (
    <li className="flex items-start justify-between gap-3 border-b border-fern/10 py-2.5 last:border-none">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-body text-[15px] text-ivory">{displayName}</span>
          {item.wrist && (
            <span
              className="rounded-full px-2 py-0.5 font-body text-[9px] uppercase tracking-wide"
              style={{
                color: wristFlag ? '#1C2B1E' : '#C9A96E',
                backgroundColor: wristFlag ? '#C9A96E' : 'rgba(201,169,110,0.15)',
              }}
            >
              {wristFlag ? 'Modified' : 'Wrist load'}
            </span>
          )}
        </div>
        {displayDetail && (
          <div className="mt-0.5 font-body text-[13px] text-sage">{displayDetail}</div>
        )}
      </div>
    </li>
  )
}

function Section({ section, wristFlag, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-fern/10 last:border-none">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 py-4 text-left"
      >
        <div>
          <h3 className="font-display text-xl italic text-gold">{section.title}</h3>
          {section.meta && (
            <p className="mt-0.5 font-body text-[11px] uppercase tracking-wide text-sage">
              {section.meta}
            </p>
          )}
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
            <ExerciseRow key={i} item={item} wristFlag={wristFlag} />
          ))}
        </ul>
      )}
    </div>
  )
}

function WorkoutCard({ day, wristFlag }) {
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

      <div className="mt-5">
        {day.sections.map((section, i) => (
          <Section key={section.title} section={section} wristFlag={wristFlag} defaultOpen={i === 0} />
        ))}
      </div>
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

function OverloadTable() {
  return (
    <div className="rounded-2xl border border-fern/15 bg-forest-mid/60 p-5 sm:p-8">
      <p className="font-body text-xs uppercase tracking-[0.2em] text-gold">Reference</p>
      <h2 className="mt-1 font-display text-2xl font-medium text-ivory sm:text-3xl">
        Progressive overload log
      </h2>
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
            {OVERLOAD_LOG.map((row) => (
              <tr key={row.exercise} className="border-b border-fern/10 last:border-none">
                <td className="py-2.5 pr-2 text-ivory">{row.exercise}</td>
                <td className="py-2.5 pr-2 whitespace-nowrap text-sage">{row.current}</td>
                <td className="py-2.5 whitespace-nowrap font-medium text-gold">{row.next}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------------- */
/*  App                                                                     */
/* ----------------------------------------------------------------------- */

function weekLabel() {
  const now = new Date()
  const day = now.getDay()
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - day)
  const saturday = new Date(sunday)
  saturday.setDate(sunday.getDate() + 6)
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(sunday)} – ${fmt(saturday)}`
}

export default function App() {
  const todayId = DAYS[new Date().getDay()].id
  const [activeId, setActiveId] = useState(todayId)
  const [wristFlag, setWristFlag] = useState(false)

  const activeDay = useMemo(() => DAYS.find((d) => d.id === activeId), [activeId])

  return (
    <div className="min-h-screen bg-forest-deep font-body text-ivory">
      <header className="border-b border-forest-canopy/40 px-5 py-6 sm:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="font-display text-2xl font-semibold tracking-[0.25em] text-ivory">
            MADELEINE
          </h1>
          <span className="font-body text-xs uppercase tracking-wide text-sage">{weekLabel()}</span>
        </div>
      </header>

      <GoalsRibbon />
      <DaySelector days={DAYS} activeId={activeId} onSelect={setActiveId} />

      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-6 sm:px-8 sm:py-10">
        <WristToggle active={wristFlag} onToggle={() => setWristFlag((f) => !f)} />
        <WorkoutCard day={activeDay} wristFlag={wristFlag} />
        <BiometricPanel />
        <OverloadTable />
      </main>

      <footer className="px-5 py-8 text-center font-body text-[11px] uppercase tracking-widest text-sage sm:px-8">
        Train with intention.
      </footer>
    </div>
  )
}
