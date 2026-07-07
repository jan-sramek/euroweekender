function unsplash(photoId: string, width = 1600) {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${width}&q=80`;
}

export const IMAGES = {
  heroHome: unsplash('1436491865332-7a61a109cc05'),
  heroAbout: unsplash('1513635269975-59663e0ac1ad'),
  heroHowItWorks: unsplash('1488085061387-422e29b40080'),
  heroFaq: unsplash('1454165804606-c3d57bc86b40'),
  heroContact: unsplash('1497366216548-37526070297c'),
  weekendTrip: unsplash('1488085061387-422e29b40080', 900),
  secureBooking: unsplash('1436491865332-7a61a109cc05', 900),
  cityBreak: unsplash('1555881400-74d7acaacd8b', 1000),
  eveningFlight: unsplash('1436491865332-7a61a109cc05', 1000),
  destinations: [
    { name: 'Barcelona', code: 'BCN', image: unsplash('1583422409516-2895a77efded', 500) },
    { name: 'Prague', code: 'PRG', image: unsplash('1551882547-ff40c63fe5fa', 500) },
    { name: 'Rome', code: 'FCO', image: unsplash('1502920917128-1aa500764cbd', 500) },
    { name: 'Amsterdam', code: 'AMS', image: unsplash('1534351590666-13e3e96b5017', 500) },
    { name: 'Vienna', code: 'VIE', image: unsplash('1502602898657-3e91760cbb34', 500) }
  ]
} as const;
