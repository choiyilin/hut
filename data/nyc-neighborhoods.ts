export type Neighborhood = { name: string; sub?: boolean }

export type NeighborhoodArea = {
  area: string
  neighborhoods: Neighborhood[]
}

export type BoroughData = {
  id: "MANHATTAN" | "BRONX" | "BROOKLYN" | "QUEENS" | "STATEN_ISLAND" | "NEW_JERSEY"
  label: string
  areas: NeighborhoodArea[]
}

export const NYC_BOROUGHS: BoroughData[] = [
  {
    id: "MANHATTAN",
    label: "MANHATTAN",
    areas: [
      {
        area: "Downtown",
        neighborhoods: [
          { name: "Financial District" },
          { name: "Battery Park City" },
          { name: "Tribeca" },
          { name: "SoHo" },
          { name: "Hudson Square", sub: true },
          { name: "Little Italy" },
          { name: "Nolita", sub: true },
          { name: "Chinatown" },
          { name: "Two Bridges" },
          { name: "Lower East Side" },
          { name: "East Village" },
          { name: "Alphabet City", sub: true },
          { name: "West Village" },
          { name: "Greenwich Village" },
          { name: "NoHo" },
        ],
      },
      {
        area: "Midtown",
        neighborhoods: [
          { name: "Chelsea" },
          { name: "West Chelsea", sub: true },
          { name: "Hell's Kitchen" },
          { name: "Hudson Yards" },
          { name: "Flatiron" },
          { name: "Gramercy Park" },
          { name: "Murray Hill" },
          { name: "Kips Bay", sub: true },
          { name: "Rose Hill", sub: true },
          { name: "Midtown" },
          { name: "Midtown East", sub: true },
          { name: "Midtown West", sub: true },
          { name: "Theater District" },
          { name: "Turtle Bay" },
          { name: "Tudor City" },
        ],
      },
      {
        area: "Upper East Side",
        neighborhoods: [
          { name: "Upper East Side" },
          { name: "Lenox Hill", sub: true },
          { name: "Yorkville", sub: true },
          { name: "Carnegie Hill", sub: true },
          { name: "Sutton Place", sub: true },
        ],
      },
      {
        area: "Upper West Side",
        neighborhoods: [
          { name: "Upper West Side" },
          { name: "Lincoln Square", sub: true },
          { name: "Manhattan Valley", sub: true },
        ],
      },
      {
        area: "Upper Manhattan",
        neighborhoods: [
          { name: "Harlem" },
          { name: "East Harlem", sub: true },
          { name: "West Harlem", sub: true },
          { name: "Morningside Heights" },
          { name: "Hamilton Heights" },
          { name: "Washington Heights" },
          { name: "Fort George", sub: true },
          { name: "Inwood" },
          { name: "Marble Hill" },
        ],
      },
    ],
  },

  {
    id: "BRONX",
    label: "BRONX",
    areas: [
      {
        area: "South Bronx",
        neighborhoods: [
          { name: "Mott Haven" },
          { name: "Port Morris" },
          { name: "Hunts Point" },
          { name: "Longwood" },
          { name: "Melrose" },
          { name: "Morrisania" },
          { name: "Claremont" },
        ],
      },
      {
        area: "Central Bronx",
        neighborhoods: [
          { name: "Fordham" },
          { name: "Belmont" },
          { name: "Tremont" },
          { name: "West Farms" },
          { name: "University Heights" },
          { name: "Highbridge" },
          { name: "Concourse Village" },
          { name: "Mount Hope" },
        ],
      },
      {
        area: "North Bronx",
        neighborhoods: [
          { name: "Riverdale" },
          { name: "Kingsbridge" },
          { name: "Norwood" },
          { name: "Wakefield" },
          { name: "Woodlawn" },
          { name: "Pelham Bay" },
          { name: "Throgs Neck" },
          { name: "Co-op City" },
          { name: "Eastchester" },
          { name: "Williamsbridge" },
        ],
      },
    ],
  },

  {
    id: "BROOKLYN",
    label: "BROOKLYN",
    areas: [
      {
        area: "Northwest Brooklyn",
        neighborhoods: [
          { name: "Downtown Brooklyn" },
          { name: "DUMBO" },
          { name: "Brooklyn Heights" },
          { name: "Vinegar Hill" },
          { name: "Cobble Hill" },
          { name: "Carroll Gardens" },
          { name: "Boerum Hill" },
          { name: "Red Hook" },
          { name: "Gowanus" },
        ],
      },
      {
        area: "Park Slope",
        neighborhoods: [
          { name: "Park Slope" },
          { name: "South Slope", sub: true },
          { name: "Windsor Terrace" },
          { name: "Prospect Heights" },
          { name: "Kensington" },
        ],
      },
      {
        area: "Williamsburg / Greenpoint",
        neighborhoods: [
          { name: "Williamsburg" },
          { name: "South Williamsburg", sub: true },
          { name: "East Williamsburg", sub: true },
          { name: "Greenpoint" },
        ],
      },
      {
        area: "Bushwick",
        neighborhoods: [
          { name: "Bushwick" },
          { name: "Ridgewood" },
        ],
      },
      {
        area: "Bed-Stuy / Crown Heights",
        neighborhoods: [
          { name: "Bedford-Stuyvesant" },
          { name: "Fort Greene" },
          { name: "Clinton Hill" },
          { name: "Ocean Hill" },
          { name: "Crown Heights" },
        ],
      },
      {
        area: "Flatbush",
        neighborhoods: [
          { name: "Flatbush" },
          { name: "East Flatbush" },
          { name: "Ditmas Park", sub: true },
          { name: "Prospect Lefferts Gardens" },
          { name: "Midwood" },
          { name: "Flatlands" },
        ],
      },
      {
        area: "Bay Ridge / Sunset Park",
        neighborhoods: [
          { name: "Bay Ridge" },
          { name: "Sunset Park" },
          { name: "Borough Park" },
          { name: "Dyker Heights" },
          { name: "Bensonhurst" },
          { name: "Bath Beach" },
        ],
      },
      {
        area: "South Brooklyn",
        neighborhoods: [
          { name: "Coney Island" },
          { name: "Brighton Beach" },
          { name: "Sheepshead Bay" },
          { name: "Manhattan Beach" },
          { name: "Gravesend" },
          { name: "Canarsie" },
          { name: "Marine Park" },
          { name: "Mill Basin" },
          { name: "Brownsville" },
          { name: "East New York" },
          { name: "Cypress Hills" },
        ],
      },
    ],
  },

  {
    id: "QUEENS",
    label: "QUEENS",
    areas: [
      {
        area: "Western Queens",
        neighborhoods: [
          { name: "Astoria" },
          { name: "Long Island City" },
          { name: "Sunnyside" },
          { name: "Woodside" },
          { name: "Jackson Heights" },
        ],
      },
      {
        area: "Central Queens",
        neighborhoods: [
          { name: "Elmhurst" },
          { name: "Corona" },
          { name: "Forest Hills" },
          { name: "Rego Park" },
          { name: "Woodhaven" },
          { name: "Middle Village" },
          { name: "Maspeth" },
          { name: "Richmond Hill" },
        ],
      },
      {
        area: "Northeast Queens",
        neighborhoods: [
          { name: "Flushing" },
          { name: "College Point" },
          { name: "Whitestone" },
          { name: "Bayside" },
          { name: "Fresh Meadows" },
          { name: "Jamaica Estates" },
          { name: "Hollis" },
          { name: "Queens Village" },
        ],
      },
      {
        area: "Southeast Queens",
        neighborhoods: [
          { name: "Jamaica" },
          { name: "St. Albans" },
          { name: "Springfield Gardens" },
          { name: "Howard Beach" },
          { name: "Ozone Park" },
          { name: "Far Rockaway" },
          { name: "Rosedale" },
          { name: "Laurelton" },
        ],
      },
    ],
  },

  {
    id: "STATEN_ISLAND",
    label: "STATEN ISLAND",
    areas: [
      {
        area: "North Shore",
        neighborhoods: [
          { name: "St. George" },
          { name: "Stapleton" },
          { name: "Tompkinsville" },
          { name: "New Brighton" },
          { name: "Clifton" },
        ],
      },
      {
        area: "Mid Island",
        neighborhoods: [
          { name: "New Springville" },
          { name: "Willowbrook" },
          { name: "Westerleigh" },
          { name: "Travis" },
        ],
      },
      {
        area: "South Shore",
        neighborhoods: [
          { name: "Tottenville" },
          { name: "Great Kills" },
          { name: "Annadale" },
          { name: "Arden Heights" },
          { name: "Huguenot" },
        ],
      },
    ],
  },

  {
    id: "NEW_JERSEY",
    label: "NEW JERSEY",
    areas: [
      {
        area: "Hudson County",
        neighborhoods: [
          { name: "Hoboken" },
          { name: "Jersey City" },
          { name: "Downtown Jersey City", sub: true },
          { name: "Journal Square", sub: true },
          { name: "Heights", sub: true },
          { name: "Weehawken" },
          { name: "Union City" },
          { name: "West New York" },
          { name: "North Bergen" },
        ],
      },
      {
        area: "Bergen County",
        neighborhoods: [
          { name: "Edgewater" },
          { name: "Fort Lee" },
          { name: "Englewood" },
          { name: "Teaneck" },
          { name: "Hackensack" },
        ],
      },
      {
        area: "Essex County",
        neighborhoods: [
          { name: "Newark" },
          { name: "Montclair" },
          { name: "Bloomfield" },
        ],
      },
    ],
  },
]

/** Flat list of all neighborhood names — used for search suggestions and NTA map matching */
export const ALL_NYC_NEIGHBORHOODS: string[] = NYC_BOROUGHS.flatMap((b) =>
  b.areas.flatMap((a) => a.neighborhoods.map((n) => n.name))
)
