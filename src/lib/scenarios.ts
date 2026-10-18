export type TranscriptLine = { role: 'assistant' | 'caller'; text: string };
export type Scenario = {
  id: string;
  title: string;
  description: string;
  icon: 'scale' | 'calendar' | 'user' | 'folder' | 'message';
  starter: string;
  transcript: TranscriptLine[];
  completed: number;
  summary: string;
};

export const scenarios: Scenario[] = [
  {
    id: 'new-inquiry', title: 'New legal inquiry', description: 'Explore a careful, non-sensitive first intake.', icon: 'scale',
    starter: "I'm looking for legal representation.", completed: 3,
    transcript: [
      { role: 'assistant', text: "Thank you for reaching out. This is an AI receptionist concept demo, not a law-firm employee or attorney. Is this a new inquiry or an existing matter?" },
      { role: 'caller', text: "It's a new inquiry." },
      { role: 'assistant', text: "Of course. At a high level, what type of legal assistance are you looking for? Please keep names and sensitive details out of this demo." },
      { role: 'caller', text: "A fictional business contract question." },
      { role: 'assistant', text: "Understood. Which state or jurisdiction is relevant to this fictional scenario?" },
    ],
    summary: 'Simulated new inquiry · broad category captured · jurisdiction to be clarified · no information sent to the firm.',
  },
  {
    id: 'consultation', title: 'Consultation request', description: 'Show how a preference is collected without booking a real appointment.', icon: 'calendar',
    starter: "I'd like to request a consultation.", completed: 4,
    transcript: [
      { role: 'assistant', text: "I can demonstrate a consultation request. This demo cannot check the office's real calendar, so nothing can be booked or confirmed here." },
      { role: 'caller', text: "I'd prefer Thursday afternoon." },
      { role: 'assistant', text: "Thank you. For this fictional request, I'll note Thursday afternoon as your preferred time. Would you prefer a simulated staff callback or a consultation request for the office to review?" },
      { role: 'caller', text: "A consultation request, please." },
      { role: 'assistant', text: "Noted in this on-screen demo only. In a live system, office staff would need to verify availability and confirm any appointment." },
    ],
    summary: 'Simulated consultation preference · Thursday afternoon · pending staff confirmation · not a booking.',
  },
  {
    id: 'staff', title: 'Reach office staff', description: 'Demonstrate a transparent human-handoff path.', icon: 'user',
    starter: "I need to reach someone at the office.", completed: 2,
    transcript: [
      { role: 'assistant', text: "Certainly. I can show how a request to speak with a person would be routed. This public demo is not connected to the office's phone or messaging systems." },
      { role: 'caller', text: "Can someone call me back?" },
      { role: 'assistant', text: "A production receptionist could collect a minimal callback request through an approved, secure workflow. No real staff member is being notified by this demo." },
    ],
    summary: 'Simulated staff callback request · handoff not sent · a live deployment needs an approved contact workflow.',
  },
  {
    id: 'existing', title: 'Existing matter', description: 'Route an existing client without requesting case details.', icon: 'folder',
    starter: "I have an existing matter.", completed: 2,
    transcript: [
      { role: 'assistant', text: "I can demonstrate the routing process. For your privacy, please don't share a case number, client documents or confidential details here." },
      { role: 'caller', text: "I want to follow up on an existing matter." },
      { role: 'assistant', text: "Understood. In a live system, I would guide you to the approved office contact for existing matters. I haven't accessed a client record or contacted anyone." },
    ],
    summary: 'Existing-matter routing demo · no client record accessed · no confidential details collected.',
  },
  {
    id: 'process', title: 'How intake works', description: 'Walk through the basic stages of an inquiry.', icon: 'message',
    starter: "How does your intake process work?",
    transcript: [
      { role: 'assistant', text: "A typical intake demonstration has three stages: understand whether the inquiry is new or existing, capture a brief non-sensitive category, and identify an appropriate next administrative step." },
      { role: 'caller', text: "What happens after that?" },
      { role: 'assistant', text: "In a properly configured system, approved office staff would review the request and confirm any next steps. This demo doesn't submit intake information to the law firm." },
    ], completed: 3,
    summary: 'Intake walkthrough completed · administrative only · no real intake submitted.',
  },
];
