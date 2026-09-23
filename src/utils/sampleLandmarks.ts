export interface SampleLandmarkPhoto {
  id: string;
  name: string;
  city: string;
  country: string;
  imageUrl: string;
  lat: number;
  lng: number;
  thumbnail: string;
  hint: string;
}

export const SAMPLE_LANDMARKS: SampleLandmarkPhoto[] = [
  {
    id: 'eiffel',
    name: 'Eiffel Tower',
    city: 'Paris',
    country: 'France',
    imageUrl: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=300&q=70',
    lat: 48.8584,
    lng: 2.2945,
    hint: 'Wrought-iron lattice tower on the Champ de Mars, built 1887-1889.',
  },
  {
    id: 'colosseum',
    name: 'The Colosseum',
    city: 'Rome',
    country: 'Italy',
    imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=300&q=70',
    lat: 41.8902,
    lng: 12.4922,
    hint: 'Largest ancient amphitheatre ever built, Flavian dynasty 70–80 AD.',
  },
  {
    id: 'bigben',
    name: 'Big Ben & Parliament',
    city: 'London',
    country: 'United Kingdom',
    imageUrl: 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&w=300&q=70',
    lat: 51.5007,
    lng: -0.1246,
    hint: 'Elizabeth Tower, iconic Victorian Gothic clock tower alongside River Thames.',
  },
  {
    id: 'shibuya',
    name: 'Shibuya Crossing',
    city: 'Tokyo',
    country: 'Japan',
    imageUrl: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=300&q=70',
    lat: 35.6595,
    lng: 139.7005,
    hint: 'World’s busiest pedestrian scramble intersection, pulse of modern Tokyo.',
  },
  {
    id: 'sagrada',
    name: 'Basílica de la Sagrada Família',
    city: 'Barcelona',
    country: 'Spain',
    imageUrl: 'https://images.unsplash.com/photo-1583779457094-0cef1bad0e0c?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1583779457094-0cef1bad0e0c?auto=format&fit=crop&w=300&q=70',
    lat: 41.4036,
    lng: 2.1744,
    hint: 'Antoni Gaudí’s unfinished masterpiece combining Gothic and curvilinear Art Nouveau.',
  },
  {
    id: 'flatiron',
    name: 'Flatiron Building',
    city: 'New York City',
    country: 'United States',
    imageUrl: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=300&q=70',
    lat: 40.7411,
    lng: -73.9897,
    hint: 'Triangular 22-story steel-framed landmark on Fifth Avenue and Broadway.',
  },
  {
    id: 'tajmahal',
    name: 'Taj Mahal',
    city: 'Agra',
    country: 'India',
    imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=300&q=70',
    lat: 27.1751,
    lng: 78.0421,
    hint: 'Ivory-white marble mausoleum on the Yamuna river, commissioned in 1631.',
  },
  {
    id: 'sydney',
    name: 'Sydney Opera House',
    city: 'Sydney',
    country: 'Australia',
    imageUrl: 'https://images.unsplash.com/photo-1523428096881-5bd79d04330f?auto=format&fit=crop&w=1200&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1523428096881-5bd79d04330f?auto=format&fit=crop&w=300&q=70',
    lat: -33.8568,
    lng: 151.2153,
    hint: 'Expressionist performing arts centre with iconic sail-shaped shell roofs.',
  }
];

// Helper to convert any image URL to Base64 in browser
export async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
