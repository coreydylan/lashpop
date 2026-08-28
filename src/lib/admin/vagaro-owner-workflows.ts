export type VagaroOwnerWorkflowKind = 'team-member' | 'service'

export const VAGARO_SYNC_SCHEDULE = {
  cronUtc: ['06:00', '14:00', '22:00'],
  cadence: 'three times daily',
  daylightPacific: ['11:00 p.m.', '7:00 a.m.', '3:00 p.m.'],
  standardPacific: ['10:00 p.m.', '6:00 a.m.', '2:00 p.m.'],
} as const

export const VAGARO_OWNER_WORKFLOWS = {
  'team-member': {
    title: 'Add a team member',
    summary: 'Create bookable providers in Vagaro first. LashPop imports the profile hidden so you can review it before publishing.',
    acknowledgement: 'I saved the employee, assigned their services, and enabled online booking in Vagaro.',
    vagaroSteps: [
      'In Vagaro, open Settings → Employee Profiles → Add Employee.',
      'Enter the employee name and email. Add the customer-facing profile photo, bio, phone, and email that should sync to LashPop.',
      'Choose Service Provider as the employee type, set the correct access level, and save the profile.',
      'From the employee row, open Action → Services. Turn on every service they perform and confirm each price and duration.',
      'From the employee row, choose Enable Online Booking so customers can book them.',
      'Confirm the employee appears on the Vagaro listing with the expected photo, bio, services, and booking availability.',
    ],
    afterSyncSteps: [
      'Find the newly imported profile. It should say Vagaro and remain hidden from the website.',
      'Review the synced photo, bio, contact details, display order, and locked service chips.',
      'Add LashPop-only quick facts, credentials, and portfolio photos if needed.',
      'Turn on the eye control, enter a short publication reason, and choose Save Changes.',
      'Open the public Find Your Stylist section and test the person’s booking path.',
    ],
    expectedResult: 'A new provider is imported active but hidden. Sync never publishes or unpublishes the profile; the eye control and Save Changes are the publication gate.',
    officialHelp: [
      {
        label: 'Vagaro: add an employee profile',
        href: 'https://support.vagaro.com/hc/en-us/articles/18977275440795-Add-an-Employee-Profile',
      },
      {
        label: 'Vagaro: edit services and online booking',
        href: 'https://support.vagaro.com/hc/en-us/articles/360009585354-Edit-an-Employee-Profile',
      },
    ],
  },
  service: {
    title: 'Add or update a service',
    summary: 'Create booking facts in Vagaro first. LashPop syncs the catalog, then keeps a brand-new service hidden until its exact booking widget is technically verified.',
    acknowledgement: 'I saved the service, assigned every provider, and turned on Show Service Online in Vagaro.',
    vagaroSteps: [
      'In Vagaro, open Settings → Service/Class Menu. On Services, choose Add → Service → Custom Service.',
      'Enter the service name, description, category, and photo. Turn on Show Service Online.',
      'Under Performed By, turn on every provider who offers it. Confirm the price and duration for each provider.',
      'Save the service, then place it in the correct category and order in the service menu.',
      'Confirm every assigned provider accepts online bookings and that the service appears on Vagaro’s customer listing.',
    ],
    afterSyncSteps: [
      'Open Settings → Vagaro sync and confirm the category, service, staff, and stylist-mapping stages completed.',
      'Find the service in Booking setup needs attention. A new service should be pending and hidden, not publicly bookable.',
      'Send the exact service name and category to the website operator for the authenticated full-catalog widget refresh and reviewed branch deployment.',
      'After that release, use this launch checklist to confirm the verified booking mapping, category copy, image, homepage card, and eligible stylist chips.',
      'Open the public service card and complete a real desktop and phone booking-path check before calling it live.',
    ],
    expectedResult: 'Existing services update automatically. A newly discovered service is imported inactive and pending because Vagaro does not expose its opaque, service-filtered widget URL through the sync APIs.',
    officialHelp: [
      {
        label: 'Vagaro: add a custom service',
        href: 'https://support.vagaro.com/hc/en-us/articles/22642423565211-Add-a-Custom-Service',
      },
      {
        label: 'Vagaro: create a booking widget',
        href: 'https://support.vagaro.com/hc/en-us/articles/204347860-Add-the-Booking-Widget-to-Your-Site',
      },
    ],
  },
} as const

