export interface Employee {
  id: number;
  name: string;
  subordinates: Employee[];
}

export interface DropInfo {
    targetId: number;
    action?: string;
}

export var demoData: Employee[] = [
  {
    id: 1,
    name: 'Mark Zuckerberg:',
    subordinates:[
      {
        id: 15,
        name: 'Sarah Danold:',
        subordinates: [
          {
            id: 2,
            name: 'Cassandra Reynolds:',
            subordinates:[
              {
                id: 3,
                name: 'Mary Blue:',
                subordinates:[]
              },
              {
                id: 4,
                name: 'Bob Saget:',
                subordinates:[
                  {
                    id: 5,
                    name: 'Tina Teff:',
                    subordinates:[
                      {
                        id: 6,
                        name: 'Will Turner:',
                        subordinates:[]
                      },
                    ]
                  },
                ]
              }
            ]
          }
        ]
      },
      {
        id: 7,
        name: 'Tyler Simpson',
        subordinates:[
          {
            id: 8,
            name: 'Harry Tobs:',
            subordinates:[
              {
                id: 9,
                name: 'Thomas Brown:',
                subordinates:[]
              },
            ]
          },
          {
            id: 10,
            name: 'George Carrey:',
            subordinates:[]
          },
          {
            id: 11,
            name: 'Gary Styles:',
            subordinates:[]
          },
        ]
      },
      {
        id: 12,
        name: 'Bruce Willis:',
        subordinates:[]
      },
      {
        id: 13,
        name: 'Georgina Flangy',
        subordinates:[
          {
            id: 14,
            name: 'Sophie:',
            subordinates:[]
          },
        ]
      }
    ]
  }
]