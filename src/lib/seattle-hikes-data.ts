/**
 * Seattle-area hike dataset.
 *
 * Data sourced from WTA (Washington Trails Association). Trailhead coordinates
 * (lat/lon) power the map and the location-based drive-time estimate; `wtaUrl`
 * is the verified canonical WTA page. Distance/gain are round-trip and
 * approximate. Difficulty, season, and pass are derived estimates — always
 * verify current conditions and permit requirements on WTA before you go.
 */
export type Difficulty = 'Easy' | 'Moderate' | 'Hard';

export type Hike = {
  name: string;
  distance: number; // round-trip miles
  gain: number; // elevation gain, ft
  difficulty: Difficulty;
  season: string;
  dog: boolean;
  pass: string;
  lat: number; // trailhead latitude
  lon: number; // trailhead longitude
  wtaUrl: string; // canonical WTA page
  region?: string;
};

// Seattle reference point (roughly downtown / Amazon HQ) for the default
// drive-time column when the user hasn't shared their location.
export const SEATTLE: { lat: number; lon: number } = { lat: 47.6156, lon: -122.3376 };

export const HIKES: Hike[] = [
  {"name":"Gold Creek Pond","distance":1,"gain":10,"difficulty":"Easy","season":"Year-round","dog":true,"pass":"NW Forest","lat":47.4094,"lon":-121.3677,"wtaUrl":"https://www.wta.org/go-hiking/hikes/gold-creek-pond","region":"Snoqualmie Region · Snoqualmie Pass"},
  {"name":"Franklin Falls","distance":2,"gain":400,"difficulty":"Easy","season":"Year-round","dog":true,"pass":"NW Forest","lat":47.4131,"lon":-121.4428,"wtaUrl":"https://www.wta.org/go-hiking/hikes/franklin-falls","region":"Snoqualmie Region"},
  {"name":"Heybrook Lookout","distance":2,"gain":980,"difficulty":"Easy","season":"Year-round","dog":true,"pass":"NW Forest","lat":47.8084,"lon":-121.5352,"wtaUrl":"https://www.wta.org/go-hiking/hikes/heybrook-lookout","region":"Central Cascades · Stevens Pass - West"},
  {"name":"Twin Falls","distance":2.4,"gain":500,"difficulty":"Easy","season":"Year-round","dog":true,"pass":"NW Forest","lat":47.4526,"lon":-121.7054,"wtaUrl":"https://www.wta.org/go-hiking/hikes/twin-falls-state-park","region":"Snoqualmie Region"},
  {"name":"Coal Creek Falls","distance":2.5,"gain":416,"difficulty":"Easy","season":"Year-round","dog":true,"pass":"None","lat":47.5348,"lon":-122.1288,"wtaUrl":"https://www.wta.org/go-hiking/hikes/coal-creek-falls","region":"Issaquah Alps · Cougar Mountain"},
  {"name":"Discovery Park Loop Trail","distance":2.8,"gain":140,"difficulty":"Easy","season":"Year-round","dog":true,"pass":"None","lat":47.6576,"lon":-122.4065,"wtaUrl":"https://www.wta.org/go-hiking/hikes/discovery-park-loop-trail","region":"Puget Sound and Islands · Seattle-Tacoma Area"},
  {"name":"Cedar Butte","distance":3.5,"gain":900,"difficulty":"Easy","season":"Year-round","dog":true,"pass":"NW Forest","lat":47.4325,"lon":-121.7663,"wtaUrl":"https://www.wta.org/go-hiking/hikes/cedar-butte","region":"Snoqualmie Region"},
  {"name":"Little Si","distance":3.7,"gain":1300,"difficulty":"Moderate","season":"Year-round","dog":true,"pass":"NW Forest","lat":47.4867,"lon":-121.7535,"wtaUrl":"https://www.wta.org/go-hiking/hikes/little-si","region":"Snoqualmie Region · North Bend Area"},
  {"name":"Poo Poo Point - Chirico Trail","distance":3.8,"gain":1760,"difficulty":"Moderate","season":"Year-round","dog":true,"pass":"None","lat":47.5,"lon":-122.0219,"wtaUrl":"https://www.wta.org/go-hiking/hikes/poo-poo-point-chirico-trail","region":"Issaquah Alps"},
  {"name":"Bridal Veil Falls","distance":4,"gain":1000,"difficulty":"Moderate","season":"Year-round","dog":true,"pass":"NW Forest","lat":47.8092,"lon":-121.574,"wtaUrl":"https://www.wta.org/go-hiking/hikes/bridal-veil-falls","region":"Central Cascades · Stevens Pass - West"},
  {"name":"Rattlesnake Ledge","distance":4,"gain":1160,"difficulty":"Moderate","season":"Year-round","dog":true,"pass":"NW Forest","lat":47.4347,"lon":-121.7687,"wtaUrl":"https://www.wta.org/go-hiking/hikes/rattlesnake-ledge","region":"Snoqualmie Region · North Bend Area"},
  {"name":"Wilderness Peak Loop","distance":4,"gain":1200,"difficulty":"Moderate","season":"Year-round","dog":true,"pass":"None","lat":47.5102,"lon":-122.0872,"wtaUrl":"https://www.wta.org/go-hiking/hikes/wilderness-peak","region":"Issaquah Alps · Cougar Mountain"},
  {"name":"Barclay Lake","distance":4.4,"gain":500,"difficulty":"Easy","season":"Year-round","dog":false,"pass":"NW Forest","lat":47.7923,"lon":-121.4592,"wtaUrl":"https://www.wta.org/go-hiking/hikes/barclay-lake","region":"Central Cascades · Stevens Pass - West"},
  {"name":"Dirty Harry's Balcony","distance":4.4,"gain":1600,"difficulty":"Moderate","season":"Year-round","dog":true,"pass":"NW Forest","lat":47.4311,"lon":-121.6325,"wtaUrl":"https://www.wta.org/go-hiking/hikes/dirty-harrys-balcony","region":"Snoqualmie Region"},
  {"name":"Oyster Dome","distance":5,"gain":1050,"difficulty":"Moderate","season":"Year-round","dog":true,"pass":"NW Forest","lat":48.6096,"lon":-122.4264,"wtaUrl":"https://www.wta.org/go-hiking/hikes/oyster-dome","region":"Puget Sound and Islands · Bellingham Area"},
  {"name":"West Tiger 3","distance":5,"gain":2100,"difficulty":"Moderate","season":"Year-round","dog":false,"pass":"None","lat":47.5296,"lon":-121.9956,"wtaUrl":"https://www.wta.org/go-hiking/hikes/west-tiger-3","region":"Issaquah Alps"},
  {"name":"Lake 22","distance":5.4,"gain":1350,"difficulty":"Moderate","season":"Year-round","dog":true,"pass":"NW Forest","lat":48.077,"lon":-121.7457,"wtaUrl":"https://www.wta.org/go-hiking/hikes/lake-22","region":"North Cascades - Mountain Loop Highway"},
  {"name":"Mount Pilchuck","distance":5.4,"gain":2300,"difficulty":"Moderate","season":"Year-round","dog":true,"pass":"NW Forest","lat":48.0702,"lon":-121.8147,"wtaUrl":"https://www.wta.org/go-hiking/hikes/mount-pilchuck","region":"North Cascades · Mountain Loop Highway"},
  {"name":"Wallace Falls State Park","distance":5.6,"gain":1300,"difficulty":"Moderate","season":"Year-round","dog":true,"pass":"Discover","lat":47.8669,"lon":-121.678,"wtaUrl":"https://www.wta.org/go-hiking/hikes/wallace-falls","region":"Central Cascades · Stevens Pass - West"},
  {"name":"Denny Creek","distance":6,"gain":1345,"difficulty":"Moderate","season":"Year-round","dog":true,"pass":"NW Forest","lat":47.413,"lon":-121.4431,"wtaUrl":"https://www.wta.org/go-hiking/hikes/denny-creek","region":"Snoqualmie Region"},
  {"name":"Talapus and Olallie Lakes","distance":6.2,"gain":1220,"difficulty":"Moderate","season":"Year-round","dog":true,"pass":"NW Forest","lat":47.4013,"lon":-121.5184,"wtaUrl":"https://www.wta.org/go-hiking/hikes/talapus-and-olallie-lakes","region":"Snoqualmie Region"},
  {"name":"May Valley Loop","distance":6.6,"gain":1684,"difficulty":"Moderate","season":"Year-round","dog":true,"pass":"None","lat":47.4819,"lon":-122.0542,"wtaUrl":"https://www.wta.org/go-hiking/hikes/squak-mountain","region":"Issaquah Alps"},
  {"name":"Heather Lake (near Lake Wenatchee)","distance":7,"gain":1350,"difficulty":"Moderate","season":"Year-round","dog":true,"pass":"NW Forest","lat":47.8664,"lon":-121.0753,"wtaUrl":"https://www.wta.org/go-hiking/hikes/heather-lake","region":"Central Cascades · Stevens Pass - East"},
  {"name":"Ira Spring Trail - Mason Lake","distance":7,"gain":2420,"difficulty":"Moderate","season":"Year-round","dog":true,"pass":"NW Forest","lat":47.4257,"lon":-121.5843,"wtaUrl":"https://www.wta.org/go-hiking/hikes/ira-spring-memorial","region":"Snoqualmie Region"},
  {"name":"Snow Lake","distance":7.2,"gain":1800,"difficulty":"Moderate","season":"Year-round","dog":true,"pass":"NW Forest","lat":47.4454,"lon":-121.423,"wtaUrl":"https://www.wta.org/go-hiking/hikes/snow-lake","region":"Snoqualmie Region"},
  {"name":"Annette Lake","distance":7.5,"gain":1800,"difficulty":"Moderate","season":"Year-round","dog":true,"pass":"NW Forest","lat":47.3928,"lon":-121.4741,"wtaUrl":"https://www.wta.org/go-hiking/hikes/annette-lake","region":"Snoqualmie Region · Snoqualmie Pass"},
  {"name":"Bandera Mountain","distance":8,"gain":3400,"difficulty":"Hard","season":"Jul–Oct","dog":true,"pass":"NW Forest","lat":47.4247,"lon":-121.5836,"wtaUrl":"https://www.wta.org/go-hiking/hikes/bandera-mountain","region":"Snoqualmie Region · North Bend Area"},
  {"name":"Mount Si","distance":8,"gain":3150,"difficulty":"Hard","season":"Jul–Oct","dog":true,"pass":"NW Forest","lat":47.488,"lon":-121.7231,"wtaUrl":"https://www.wta.org/go-hiking/hikes/mount-si","region":"Snoqualmie Region · North Bend Area"},
  {"name":"Lake Serene","distance":8.2,"gain":2000,"difficulty":"Moderate","season":"Year-round","dog":true,"pass":"NW Forest","lat":47.809,"lon":-121.5738,"wtaUrl":"https://www.wta.org/go-hiking/hikes/lake-serene","region":"Central Cascades · Stevens Pass - West"},
  {"name":"Wallace Falls State Park - Greg Ball Trail to Wallace Lake","distance":8.2,"gain":1500,"difficulty":"Moderate","season":"Year-round","dog":true,"pass":"Discover","lat":47.8669,"lon":-121.682,"wtaUrl":"https://www.wta.org/go-hiking/hikes/wallace-lake","region":"Central Cascades · Stevens Pass - West"},
  {"name":"Melakwa Lake","distance":8.5,"gain":2700,"difficulty":"Hard","season":"Jul–Oct","dog":true,"pass":"NW Forest","lat":47.4151,"lon":-121.4432,"wtaUrl":"https://www.wta.org/go-hiking/hikes/melakwa-lake","region":"Snoqualmie Region"},
  {"name":"Boulder River","distance":8.6,"gain":1000,"difficulty":"Moderate","season":"Year-round","dog":true,"pass":"NW Forest","lat":48.2509,"lon":-121.8172,"wtaUrl":"https://www.wta.org/go-hiking/hikes/boulder-river","region":"North Cascades - Mountain Loop Highway"},
  {"name":"Granite Mountain","distance":8.6,"gain":3800,"difficulty":"Hard","season":"Jul–Oct","dog":true,"pass":"NW Forest","lat":47.3979,"lon":-121.4861,"wtaUrl":"https://www.wta.org/go-hiking/hikes/granite-mountain","region":"Snoqualmie Region · Snoqualmie Pass"},
  {"name":"Mailbox Peak","distance":9.4,"gain":4000,"difficulty":"Hard","season":"Jul–Oct","dog":true,"pass":"NW Forest","lat":47.4675,"lon":-121.6748,"wtaUrl":"https://www.wta.org/go-hiking/hikes/mailbox-peak","region":"Snoqualmie Region"},
  {"name":"Rattlesnake Mountain","distance":10.5,"gain":2775,"difficulty":"Hard","season":"Jul–Oct","dog":false,"pass":"NW Forest","lat":47.5092,"lon":-121.8434,"wtaUrl":"https://www.wta.org/go-hiking/hikes/rattlesnake-mountain","region":"Snoqualmie Region · North Bend Area"},
  {"name":"Kendall Katwalk","distance":12,"gain":2600,"difficulty":"Hard","season":"Jul–Oct","dog":true,"pass":"NW Forest","lat":47.4278,"lon":-121.4135,"wtaUrl":"https://www.wta.org/go-hiking/hikes/kendall-katwalk","region":"Snoqualmie Region · Snoqualmie Pass"},
  {"name":"Mount Teneriffe","distance":13,"gain":3800,"difficulty":"Hard","season":"Jul–Oct","dog":true,"pass":"NW Forest","lat":47.4869,"lon":-121.7097,"wtaUrl":"https://www.wta.org/go-hiking/hikes/mount-teneriffe","region":"Snoqualmie Region · North Bend Area"},
  {"name":"Tiger Mountain Trail","distance":15.2,"gain":2360,"difficulty":"Hard","season":"Year-round","dog":true,"pass":"None","lat":47.4425,"lon":-121.9776,"wtaUrl":"https://www.wta.org/go-hiking/hikes/tiger-mountain-trail","region":"Issaquah Alps"},
];
