export interface Rooftop {
  id: string;
  name: string;
  address: string;
  locationType: 'rooftop';
  capacity: number;
  views: string;
  lat: number;
  lng: number;
}

export const WRIGLEYVILLE_ROOFTOPS: Rooftop[] = [
  { id: 'skybox-sheffield', name: 'Skybox on Sheffield', address: '3627 N Sheffield Ave, Chicago, IL', locationType: 'rooftop', capacity: 200, views: 'Right field and the iconic ivy wall', lat: 41.9486, lng: -87.6539 },
  { id: 'lakeview-baseball-club', name: 'Lakeview Baseball Club', address: '3633 N Sheffield Ave, Chicago, IL', locationType: 'rooftop', capacity: 175, views: 'Right field, bullpens, and scoreboard', lat: 41.9489, lng: -87.6539 },
  { id: 'ivy-league-rooftop', name: 'Ivy League Rooftop', address: '1032 W Waveland Ave, Chicago, IL', locationType: 'rooftop', capacity: 150, views: 'Left field, ivy wall, and scoreboard', lat: 41.9495, lng: -87.6553 },
  { id: 'murphys-rooftop', name: "Murphy's Rooftop", address: '3655 N Sheffield Ave, Chicago, IL', locationType: 'rooftop', capacity: 250, views: 'Right field with skyline backdrop', lat: 41.9491, lng: -87.6539 },
  { id: 'wrigley-rooftop', name: 'Wrigley Rooftop', address: '3617 N Sheffield Ave, Chicago, IL', locationType: 'rooftop', capacity: 180, views: 'Right field and bleachers', lat: 41.9484, lng: -87.6539 },
  { id: 'century-isle', name: 'Century Isle', address: '3621 N Sheffield Ave, Chicago, IL', locationType: 'rooftop', capacity: 160, views: 'Right field with panoramic views', lat: 41.9485, lng: -87.6539 },
  { id: 'horizon-sports', name: 'Horizon Sports & Experiences', address: '1038 W Waveland Ave, Chicago, IL', locationType: 'rooftop', capacity: 220, views: 'Left center field and scoreboard', lat: 41.9495, lng: -87.6555 },
  { id: 'adrenaline-rooftop', name: 'Adrenaline Rooftop', address: '3631 N Sheffield Ave, Chicago, IL', locationType: 'rooftop', capacity: 140, views: 'Right field and Sheffield Ave action', lat: 41.9487, lng: -87.6539 },
  { id: 'fenway-rooftop', name: 'Fenway Rooftop', address: '3625 N Sheffield Ave, Chicago, IL', locationType: 'rooftop', capacity: 130, views: 'Right field bullpens', lat: 41.9486, lng: -87.6539 },
  { id: 'sports-corner-rooftop', name: 'Sports Corner Rooftop', address: '956 W Addison St, Chicago, IL', locationType: 'rooftop', capacity: 120, views: 'Home plate from across Addison', lat: 41.9476, lng: -87.6555 },
  { id: 'bleacher-nation-rooftop', name: 'Bleacher Nation Rooftop', address: '3639 N Sheffield Ave, Chicago, IL', locationType: 'rooftop', capacity: 110, views: 'Right field and bleachers below', lat: 41.9488, lng: -87.6539 },
  { id: 'sheffields-rooftop', name: "Sheffield's Rooftop", address: '3641 N Sheffield Ave, Chicago, IL', locationType: 'rooftop', capacity: 150, views: 'Right field with classic Wrigley sightlines', lat: 41.9489, lng: -87.6539 },
];

export const ROOFTOP_NAMES = WRIGLEYVILLE_ROOFTOPS.map(r => r.name);
