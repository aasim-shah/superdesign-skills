/**
 * home.ts: the home page copy, from the live site (research/content-dump.md) and the site's own
 * ChallengeLab component (alarm-qr/website/components/ChallengeLab.tsx). Nothing here is invented.
 * Handoff: app/content/home.ts.
 */
export const hero = {
  kicker: 'Built for people who snooze',
  title: ['Wake up.', 'Walk away.'],
  lead: 'WalkAway turns your alarm into a tiny morning mission. Scan, tap, move, match, or speak, so dismissing it requires being genuinely awake.',
  trust: 'No account · No tracking · Your data stays on your device',
};

export const behavior = {
  title: ['A tap proves nothing.', 'A mission does.'],
  lead: 'Traditional alarms put the off switch beside the pillow. WalkAway asks for evidence that your body and attention have left sleep mode.',
  ordinary: { label: 'Ordinary alarm · 06:30', title: 'One unconscious tap.', body: 'Sound stops. Eyes stay closed. The decision happens before you are awake enough to remember it.' },
  walkaway: { label: 'WalkAway · 06:30', title: 'Real-world proof.', body: 'You reached the target, completed the live challenge, and gave your morning enough momentum to continue.' },
};

export type Challenge = { id: string; n: string; label: string; verb: string; title: string; body: string; target: string; proof: string };

export const challenges: Challenge[] = [
  { id: 'qr', n: '01', label: 'QR code', verb: 'Walk. Aim. Scan.', title: 'Put the finish line in another room.', body: 'Print a code from WalkAway, place it where your day should begin, and make a live scan the only normal way to stop the alarm.', target: 'Bathroom mirror', proof: 'Code matched' },
  { id: 'nfc', n: '02', label: 'NFC tag', verb: 'Reach. Tap. Done.', title: 'Turn a physical tag into your off switch.', body: 'Register a tag once, place it across the room, and require that exact NFC identity when the alarm rings.', target: 'Kitchen tag', proof: 'Tag verified' },
  { id: 'object', n: '03', label: 'Object', verb: 'Find. Frame. Match.', title: 'Make a real object prove where you are.', body: 'Enroll three live views of a familiar object. WalkAway matches compact visual descriptors on-device, without saving camera frames.', target: 'Coffee machine', proof: 'Object matched' },
  { id: 'move', n: '04', label: 'Movement', verb: 'Stand. Move. Count.', title: 'Use motion to clear the morning fog.', body: 'Choose squats, jumping jacks, push-ups, or jumps. Live pose estimation counts deliberate repetitions, not random camera motion.', target: '10 squats', proof: '10 / 10 complete' },
  { id: 'voice', n: '05', label: 'Voice', verb: 'Focus. Speak. Confirm.', title: 'Say something your sleeping brain cannot fake.', body: 'Choose a phrase of four or more words. WalkAway checks live speech while presence remains visible. Audio is never stored by the app.', target: '“Today starts now”', proof: 'Phrase confirmed' },
];

export const journey = {
  title: 'From tonight’s intention to tomorrow’s first win.',
  lead: 'WalkAway keeps setup calm and makes the morning action unmistakable.',
  steps: [
    { time: '22:14', label: 'Tonight', title: 'Choose 06:30', body: 'Name the routine, pick repeat days, and decide whether snooze belongs in the plan.' },
    { time: '22:16', label: 'Setup', title: 'Register the proof', body: 'Print a QR code, tap an NFC tag, enroll an object, or configure movement and voice.' },
    { time: '06:30', label: 'Morning', title: 'The alarm takes over', body: 'A full, focused screen shows exactly what must happen next. No tiny mystery controls.' },
    { time: '06:32', label: 'Awake', title: 'Proof accepted', body: 'The alarm stops, the result enters local history, and your day already has momentum.' },
  ],
};

export const strict = {
  title: 'Strict Mode closes the loopholes.',
  lead: 'WalkAway gives tonight-you control over the shortcuts morning-you will try.',
  toggles: [
    { id: 'snooze', title: 'Challenge before snooze', body: 'A sleepy tap is not enough.', on: true },
    { id: 'confirm', title: 'Wake confirmation', body: 'Check back after dismissal.', on: true },
    { id: 'volume', title: 'Gradual alarm volume', body: 'Start soft, finish certain.', on: false },
  ],
  readiness: {
    title: 'Device readiness',
    note: 'Reliability is visible, not assumed. WalkAway checks the permissions and platform capabilities that affect your alarm before bedtime.',
    items: [
      { label: 'Alarm notifications', state: 'Enabled' },
      { label: 'Camera challenges', state: 'Granted' },
      { label: 'AlarmKit / exact alarm', state: 'Available' },
      { label: 'Target tested', state: 'Verified' },
    ],
  },
};

export const privacy = {
  kicker: 'Live proof without a personal profile',
  title: 'Your camera helps you wake. It does not watch you.',
  lead: 'QR frames, object descriptors, pose landmarks, and voice challenges exist to verify the action in front of you. WalkAway is built around local state and live, on-device processing.',
  points: ['No WalkAway account required', 'Camera frames are not recorded or uploaded', 'Voice audio is not stored by WalkAway', 'Alarm history remains on your phone'],
  link: 'See exactly what stays local',
};

export const early = {
  title: 'Put the off switch somewhere worth reaching.',
  lead: 'Build a morning that begins with a completed action, not another forgotten snooze. Join early access and help test WalkAway before launch.',
  consent: 'I agree that CoreByte Studio may use these details to manage WalkAway early access and contact me about testing and launch updates. I can unsubscribe or request deletion at any time.',
};
