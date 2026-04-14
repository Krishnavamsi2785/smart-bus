const fs = require('fs');

const routesData = [
  {
      name: "Visakhapatnam - Vijayawada", 
      stops: ["Visakhapatnam", "Anakapalle", "Tuni", "Annavaram", "Kakinada Bypass", "Rajahmundry", "Kovvur", "Tadepalligudem", "Eluru", "Gannavaram", "Vijayawada"]
  },
  {
      name: "Vijayawada - Tirupati",
      stops: ["Vijayawada", "Mangalagiri", "Guntur", "Chilakaluripet", "Ongole", "Kavali", "Nellore", "Gudur", "Naidupeta", "Srikalahasti", "Tirupati"]
  },
  {
      name: "Tirupati - Kurnool", 
      stops: ["Tirupati", "Chandragiri", "Bhakarapet", "Pileru", "Rayachoty", "Kadapa", "Proddatur", "Allagadda", "Nandyal", "Kurnool"]
  },
  {
      name: "Kurnool - Anantapur", 
      stops: ["Kurnool", "Veldurthi", "Dhone", "Peapully", "Gooty", "Guntakal Bypass", "Pamidi", "Garladinne", "Anantapur"]
  },
  {
      name: "Ichchapuram - Visakhapatnam", 
      stops: ["Ichchapuram", "Sompeta", "Palasa", "Tekkali", "Narasannapeta", "Srikakulam", "Ranasthalam", "Vizianagaram", "Anandapuram", "Visakhapatnam"]
  },
  {
      name: "Guntur - Hyderabad", 
      stops: ["Guntur", "Sattenapalli", "Piduguralla", "Dachepalli", "Miryalaguda", "Nalgonda", "Narketpalli", "Choutuppal", "LB Nagar", "Hyderabad"]
  },
  {
      name: "Nellore - Chennai", 
      stops: ["Nellore", "Venkatachalam", "Gudur", "Naidupeta", "Doravarisatram", "Sullurpeta", "Tada", "Gummidipoondi", "Red Hills", "Chennai"]
  },
  {
      name: "Kakinada - Visakhapatnam", 
      stops: ["Kakinada", "Pitapuram", "Kathipudi", "Annavaram", "Tuni", "Payakaraopeta", "Nakkapalli", "Yelamanchili", "Anakapalle", "Gajuwaka", "Visakhapatnam"]
  },
  {
      name: "Rajahmundry - Bhadrachalam", 
      stops: ["Rajahmundry", "Diwancheruvu", "Rajanagaram", "Jaggampeta", "Gokavaram", "Rampachodavaram", "Maredumilli", "Chinturu", "Rukkodu", "Bhadrachalam"]
  },
  {
      name: "Vijayawada - Bhimavaram", 
      stops: ["Vijayawada", "Kankipadu", "Vuyyuru", "Pamarru", "Gudivada", "Bantumilli", "Mudinepalli", "Kaikaluru", "Akividu", "Bhimavaram"]
  },
  {
      name: "Kadapa - Anantapur", 
      stops: ["Kadapa", "Pendlimarri", "Vempalli", "Pulivendula", "Kadiri", "Mudigubba", "Bathalapalli", "Anantapur"]
  },
  {
      name: "Ongole - Kurnool", 
      stops: ["Ongole", "Chimakurthy", "Podili", "Markapuram", "Giddalur", "Cumbum", "Nandyal", "Panyam", "Orvakal", "Kurnool"]
  },
  {
      name: "Tirupati - Bengaluru", 
      stops: ["Tirupati", "Chandragiri", "Chittoor", "Palamaner", "V Kota", "Mulbagal", "Kolar", "Hoskote", "KR Puram", "Bengaluru"]
  },
  {
      name: "Nellore - Kadapa", 
      stops: ["Nellore", "Podalakur", "Rapur", "Chitvel", "Rajampet", "Nandalur", "Vontimitta", "Kadapa"]
  },
  {
      name: "Machilipatnam - Hyderabad", 
      stops: ["Machilipatnam", "Gudivada", "Pamarru", "Vijayawada", "Nandigama", "Jaggaiahpet", "Kodad", "Suryapet", "Nakrekal", "Choutuppal", "Hyderabad"]
  }
];

let csvContent = 'bus_code,route,stops,stop_order\n';

for (let i = 1; i <= 100; i++) {
  const busCode = 'B' + i.toString().padStart(3, '0');
  const route = routesData[Math.floor(Math.random() * routesData.length)];
  
  route.stops.forEach((stop, index) => {
    // Wrap stops/routes in quotes if they contain commas, though these don't
    const stopOrder = index + 1;
    csvContent += busCode + ',' + route.name + ',' + stop + ',' + stopOrder + '\\n';
  });
}

const outputPath = 'c:/Users/bhavy/OneDrive/Desktop/BUS TICKETING/apsrtc_buses_dataset.csv';
fs.writeFileSync(outputPath, csvContent);
console.log('Successfully generated ' + outputPath);
