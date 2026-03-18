const fs = require('fs');
const path = require('path');

const existingReps = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'reps.json'), 'utf8')
);

const firstNames = [
  'Oliver','Charlotte','Liam','Amelia','Noah','Isla','Jack','Ava','Harry','Mia',
  'George','Grace','Leo','Freya','Arthur','Emily','Oscar','Poppy','Charlie','Ella',
  'William','Sophie','Henry','Lily','Thomas','Rosie','Edward','Ruby','Samuel','Florence',
  'Benjamin','Chloe','Freddie','Evie','Lucas','Hannah','Ethan','Alice','Alfie','Lucy',
  'Daniel','Eleanor','Jacob','Jessica','Joseph','Molly','Archie','Daisy','Ryan','Scarlett',
  'Connor','Bethany','Aiden','Holly','Dylan','Phoebe','Nathan','Amber','Callum','Zara',
  'Rhys','Sian','Gareth','Cerys','Owen','Nia','Idris','Bethan','Gethin','Megan',
  'Rajesh','Anita','Vikram','Sunita','Aarav','Priya','Arjun','Meera','Ravi','Kavita',
  'Kwame','Abena','Chidi','Ngozi','Olu','Funke','Kofi','Adaeze','Yemi','Temi',
  'Jakub','Katarzyna','Tomasz','Agnieszka','Piotr','Marta','Marek','Ewa','Pawel','Joanna',
  'Andrei','Elena','Stefan','Irina','Dragos','Mihaela','Adrian','Cristina','Vlad','Ana',
  'Mohammed','Fatima','Hassan','Aisha','Ibrahim','Yasmin','Ahmed','Layla','Ali','Nadia',
  'Sean','Niamh','Cian','Aoife','Declan','Siobhan','Patrick','Ciara','Brendan','Orla',
  'Tariq','Samina','Imran','Nazia','Asif','Shabana','Kamran','Rukhsana','Faisal','Bushra',
  'Wei','Mei','Jun','Xia','Chen','Lin','Yun','Ling','Kai','Jing',
  'Marcus','Tanya','Craig','Leanne','Stuart','Donna','Keith','Tracey','Neil','Janet',
  'Malcolm','Dorothy','Kenneth','Jean','Colin','Margaret','Derek','Patricia','Clive','Shirley',
  'Fraser','Morag','Ewan','Eilidh','Hamish','Catriona','Ross','Fiona','Blair','Kirsty'
];

const lastNames = [
  'Smith','Jones','Williams','Taylor','Brown','Davies','Wilson','Evans','Thomas','Roberts',
  'Johnson','Walker','Wright','Robinson','Thompson','White','Hughes','Edwards','Green','Hall',
  'Lewis','Harris','Clarke','Patel','Jackson','Wood','Turner','Martin','Cooper','Hill',
  'Ward','Morris','Moore','King','Watson','Baker','Barker','Fisher','Murray','Bailey',
  'Morgan','Bennett','Gray','Harvey','Price','Adams','Mitchell','Campbell','Phillips','Carter',
  'Shaw','Marshall','Simpson','Henderson','Ross','Hamilton','Graham','Young','Scott','Gibson',
  'Reid','Anderson','MacDonald','Stewart','Crawford','Kennedy','Wallace','MacLeod','Sinclair','Burns',
  'O\'Connor','O\'Brien','Byrne','Fitzgerald','Gallagher','Doyle','Murphy','Kelly','Walsh','Brennan',
  'Khan','Hussain','Ahmed','Ali','Begum','Malik','Chaudhry','Akhtar','Mirza','Shah',
  'Singh','Kaur','Sharma','Gill','Dhillon','Johal','Sandhu','Bains','Grewal','Atwal',
  'Okafor','Adeyemi','Osei','Mensah','Asante','Boateng','Owusu','Agyemang','Nkrumah','Appiah',
  'Nowak','Kowalski','Wisniewski','Wojciechowski','Kaminski','Lewandowski','Zielinski','Szymanski','Kozlowski','Jankowski',
  'Popescu','Ionescu','Popa','Dumitrescu','Stan','Munteanu','Gheorghe','Radu','Stoica','Barbu',
  'Chen','Wang','Li','Zhang','Liu','Yang','Huang','Wu','Zhou','Xu',
  'Martinez','Garcia','Fernandez','Rodriguez','Santos','Pereira','Costa','Oliveira','Silva','Souza',
  'Demir','Yilmaz','Kaya','Celik','Ozturk','Aydin','Arslan','Dogan','Kilic','Polat',
  'Hassan','Ibrahim','Omar','Abdi','Mohamed','Adan','Farah','Warsame','Egal','Jama'
];

const counties = [
  'Kent','London','Essex','Sussex','Surrey','Hampshire','Devon','Somerset','Dorset',
  'Gloucestershire','Oxfordshire','Berkshire','Hertfordshire','Cambridgeshire','Norfolk',
  'Suffolk','West Midlands','Greater Manchester','West Yorkshire','Merseyside',
  'South Yorkshire','Lancashire','Nottinghamshire','Northamptonshire','Warwickshire',
  'Wiltshire','Cornwall','Derbyshire','Durham','Leicestershire','Lincolnshire',
  'North Yorkshire','Humberside','Staffordshire','Tyne and Wear','Cleveland',
  'Cumbria','Bedfordshire','Buckinghamshire','North Wales','South Wales','Gwent','Dyfed-Powys'
];

const stationsByCounty = {
  'Kent': ['Maidstone','Canterbury','Medway','Folkestone','Dover','Ashford','Tunbridge Wells','Margate','Gravesend','Dartford','Tonbridge','Sittingbourne','Gillingham','Sevenoaks','Herne Bay','Deal','Whitstable'],
  'London': ['Charing Cross','Brixton','Lewisham','Croydon','Tottenham','Stoke Newington','Paddington Green','Bethnal Green','Holborn','Walworth','Islington','Barking','Ilford','Woolwich','Southwark','Westminster','Hammersmith','Wood Green','Bromley','Sutton','Kingston','Ealing','Uxbridge','Wembley','Romford','Stratford','Forest Gate','Plaistow','Peckham','Catford'],
  'Essex': ['Chelmsford','Southend','Basildon','Colchester','Harlow','Braintree','Grays','Rayleigh','Clacton','Brentwood','Witham','Canvey Island','Maldon','Saffron Walden','Epping'],
  'Sussex': ['Brighton','Eastbourne','Hastings','Chichester','Crawley','Worthing','Horsham','Lewes','Bognor Regis','Haywards Heath','Littlehampton','Newhaven','Hove'],
  'Surrey': ['Guildford','Woking','Staines','Reigate','Epsom','Redhill','Leatherhead','Esher','Camberley','Farnham','Godalming','Dorking'],
  'Hampshire': ['Southampton Central','Portsmouth Central','Basingstoke','Winchester','Fareham','Andover','Aldershot','Gosport','Havant','Eastleigh','New Forest','Farnborough'],
  'Devon': ['Exeter','Plymouth','Torquay','Barnstaple','Newton Abbot','Exmouth','Tiverton','Paignton','Bideford','Ilfracombe'],
  'Somerset': ['Taunton','Bath','Bridgwater','Yeovil','Frome','Wells','Glastonbury','Minehead'],
  'Dorset': ['Bournemouth','Poole','Weymouth','Dorchester','Ferndown','Christchurch','Blandford Forum','Wareham'],
  'Gloucestershire': ['Gloucester','Cheltenham','Stroud','Cirencester','Tewkesbury','Forest of Dean'],
  'Oxfordshire': ['Oxford','Banbury','Bicester','Witney','Abingdon','Didcot','Henley-on-Thames','Thame'],
  'Berkshire': ['Reading','Slough','Bracknell','Maidenhead','Newbury','Wokingham','Windsor','Ascot'],
  'Hertfordshire': ['Hatfield','Watford','Stevenage','St Albans','Hemel Hempstead','Welwyn Garden City','Hitchin','Hertford','Borehamwood','Bishops Stortford'],
  'Cambridgeshire': ['Cambridge','Peterborough','Huntingdon','Ely','Wisbech','St Neots','March','Chatteris'],
  'Norfolk': ['Norwich','King\'s Lynn','Great Yarmouth','Thetford','Dereham','Cromer','Wymondham','Swaffham'],
  'Suffolk': ['Ipswich','Bury St Edmunds','Lowestoft','Felixstowe','Sudbury','Haverhill','Mildenhall','Stowmarket'],
  'West Midlands': ['Birmingham Central','Coventry','Wolverhampton','Walsall','Dudley','West Bromwich','Solihull','Sutton Coldfield','Halesowen','Stourbridge','Sandwell','Perry Barr'],
  'Greater Manchester': ['Manchester Central','Salford','Bolton','Oldham','Rochdale','Stockport','Tameside','Wigan','Bury','Trafford','Ashton-under-Lyne','Eccles','Middleton','Hyde'],
  'West Yorkshire': ['Leeds','Bradford','Huddersfield','Wakefield','Halifax','Dewsbury','Keighley','Pontefract','Batley','Castleford','Otley','Wetherby'],
  'Merseyside': ['Liverpool Central','Birkenhead','St Helens','Southport','Wallasey','Bootle','Huyton','Kirkby','Knowsley','Halewood'],
  'South Yorkshire': ['Sheffield Central','Doncaster','Rotherham','Barnsley','Maltby','Wombwell','Mexborough','Wath upon Dearne'],
  'Lancashire': ['Preston','Blackburn','Burnley','Lancaster','Blackpool','Chorley','Accrington','Nelson','Skelmersdale','Ormskirk','Leyland','Morecambe'],
  'Nottinghamshire': ['Nottingham Central','Mansfield','Newark','Worksop','Arnold','Beeston','Hucknall','Retford','Bingham'],
  'Northamptonshire': ['Northampton','Kettering','Corby','Wellingborough','Daventry','Rushden','Towcester','Brackley'],
  'Warwickshire': ['Warwick','Leamington Spa','Nuneaton','Rugby','Stratford-upon-Avon','Bedworth','Kenilworth','Atherstone'],
  'Wiltshire': ['Swindon','Salisbury','Trowbridge','Chippenham','Devizes','Melksham','Marlborough','Warminster'],
  'Cornwall': ['Truro','Penzance','Falmouth','Newquay','Bodmin','St Austell','Camborne','Redruth','Launceston','Bude'],
  'Derbyshire': ['Derby','Chesterfield','Buxton','Ilkeston','Matlock','Swadlincote','Long Eaton','Glossop','Belper','Ripley'],
  'Durham': ['Durham','Darlington','Bishop Auckland','Newton Aycliffe','Consett','Peterlee','Seaham','Spennymoor','Chester-le-Street'],
  'Leicestershire': ['Leicester','Loughborough','Hinckley','Melton Mowbray','Coalville','Market Harborough','Wigston','Lutterworth'],
  'Lincolnshire': ['Lincoln','Boston','Grantham','Skegness','Stamford','Spalding','Gainsborough','Sleaford','Louth'],
  'North Yorkshire': ['York','Harrogate','Scarborough','Northallerton','Skipton','Selby','Ripon','Whitby','Knaresborough','Malton'],
  'Humberside': ['Hull','Grimsby','Scunthorpe','Cleethorpes','Goole','Bridlington','Beverley','Immingham'],
  'Staffordshire': ['Stoke-on-Trent','Stafford','Burton upon Trent','Tamworth','Lichfield','Newcastle-under-Lyme','Cannock','Rugeley','Leek','Uttoxeter'],
  'Tyne and Wear': ['Newcastle Central','Gateshead','Sunderland','South Shields','North Shields','Wallsend','Jarrow','Washington','Whitley Bay'],
  'Cleveland': ['Middlesbrough','Stockton-on-Tees','Hartlepool','Redcar','Billingham','Guisborough','Thornaby','Yarm'],
  'Cumbria': ['Carlisle','Barrow-in-Furness','Kendal','Penrith','Workington','Whitehaven','Keswick','Cockermouth'],
  'Bedfordshire': ['Bedford','Luton','Dunstable','Biggleswade','Leighton Buzzard','Ampthill','Sandy','Flitwick'],
  'Buckinghamshire': ['Aylesbury','High Wycombe','Milton Keynes','Amersham','Chesham','Beaconsfield','Marlow','Princes Risborough'],
  'North Wales': ['Wrexham','Rhyl','Colwyn Bay','Bangor','Llandudno','Caernarfon','Holyhead','Mold','Llangefni','Dolgellau'],
  'South Wales': ['Cardiff Central','Swansea','Newport','Bridgend','Neath','Port Talbot','Barry','Pontypridd','Merthyr Tydfil','Llanelli'],
  'Gwent': ['Cwmbran','Pontypool','Ebbw Vale','Tredegar','Abergavenny','Monmouth','Caldicot','Chepstow','Risca','Blackwood'],
  'Dyfed-Powys': ['Carmarthen','Haverfordwest','Aberystwyth','Llanelli','Brecon','Newtown','Llandrindod Wells','Milford Haven','Tenby','Cardigan']
};

const specialisms = [
  'Serious crime','Fraud','Drug offences','Youth justice','Vulnerable adults',
  'Domestic violence','Motoring offences','Assault','Public order','Theft',
  'Burglary','Robbery','Sexual offences','Harassment','Immigration offences',
  'White-collar crime','Cybercrime','Commercial crime','Money laundering','Firearms',
  'Organised crime','Environmental crime','Terrorism','Counter-terrorism','Mental health',
  'Historic offences','Criminal damage','Possession of weapons','Drink driving','Agricultural crime'
];

const additionalLanguages = [
  'Polish','Urdu','Hindi','Gujarati','Bengali','Arabic','Romanian','Spanish',
  'French','Mandarin','Cantonese','Portuguese','Turkish','Somali','Punjabi'
];

const availabilityOptions = [
  { value: 'full-time', weight: 60 },
  { value: 'part-time', weight: 15 },
  { value: 'weekends', weight: 10 },
  { value: 'nights', weight: 5 },
  { value: 'on-call', weight: 10 }
];

const accreditationOptions = [
  { value: 'Law Society Accredited Police Station Representative', weight: 55 },
  { value: 'Duty Solicitor Accredited', weight: 30 },
  { value: 'Probationary Representative', weight: 10 },
  { value: 'Accredited Representative', weight: 5 }
];

// Deterministic seed-based RNG
let seed = 42;
function rand() {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
}

function pick(arr) {
  return arr[Math.floor(rand() * arr.length)];
}

function pickN(arr, min, max) {
  const n = min + Math.floor(rand() * (max - min + 1));
  const shuffled = [...arr].sort(() => rand() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

function weightedPick(options) {
  const total = options.reduce((s, o) => s + o.weight, 0);
  let r = rand() * total;
  for (const opt of options) {
    r -= opt.weight;
    if (r <= 0) return opt.value;
  }
  return options[options.length - 1].value;
}

// County assignment plan: ensure distribution targets
// High-density: Kent, London, Essex, Greater Manchester, West Midlands (15-20 each)
// Mid: Sussex, Surrey, Hampshire, Devon, West Yorkshire, Merseyside, South Yorkshire, Lancashire, Nottinghamshire, Hertfordshire, Cambridgeshire, Norfolk, Suffolk, Warwickshire (5-10)
// Lower: the rest (3-5)
const countyTargets = {
  'Kent': 18, 'London': 20, 'Essex': 16, 'Greater Manchester': 17, 'West Midlands': 16,
  'Sussex': 8, 'Surrey': 7, 'Hampshire': 8, 'Devon': 6, 'Somerset': 5, 'Dorset': 5,
  'Gloucestershire': 4, 'Oxfordshire': 5, 'Berkshire': 5, 'Hertfordshire': 7,
  'Cambridgeshire': 5, 'Norfolk': 5, 'Suffolk': 5, 'West Yorkshire': 9,
  'Merseyside': 7, 'South Yorkshire': 7, 'Lancashire': 8, 'Nottinghamshire': 6,
  'Northamptonshire': 4, 'Warwickshire': 5, 'Wiltshire': 4, 'Cornwall': 4,
  'Derbyshire': 5, 'Durham': 4, 'Leicestershire': 5, 'Lincolnshire': 4,
  'North Yorkshire': 5, 'Humberside': 4, 'Staffordshire': 5, 'Tyne and Wear': 5,
  'Cleveland': 4, 'Cumbria': 3, 'Bedfordshire': 4, 'Buckinghamshire': 4,
  'North Wales': 4, 'South Wales': 5, 'Gwent': 3, 'Dyfed-Powys': 3
};

// Track how many reps cover each county from existing data
const countyCounts = {};
counties.forEach(c => countyCounts[c] = 0);
existingReps.forEach(rep => {
  rep.counties.forEach(c => { if (countyCounts[c] !== undefined) countyCounts[c]++; });
});

// Neighbouring counties for realistic multi-county coverage
const neighbours = {
  'Kent': ['London','Essex','Sussex','Surrey'],
  'London': ['Kent','Essex','Sussex','Surrey','Hertfordshire','Berkshire','Buckinghamshire','Bedfordshire'],
  'Essex': ['London','Kent','Hertfordshire','Suffolk','Cambridgeshire'],
  'Sussex': ['Kent','London','Surrey','Hampshire'],
  'Surrey': ['London','Kent','Sussex','Hampshire','Berkshire','Buckinghamshire'],
  'Hampshire': ['Sussex','Surrey','Berkshire','Dorset','Wiltshire'],
  'Devon': ['Somerset','Dorset','Cornwall'],
  'Somerset': ['Devon','Dorset','Wiltshire','Gloucestershire'],
  'Dorset': ['Devon','Somerset','Hampshire','Wiltshire'],
  'Gloucestershire': ['Somerset','Wiltshire','Oxfordshire','Herefordshire','Worcestershire','Warwickshire'],
  'Oxfordshire': ['Gloucestershire','Berkshire','Buckinghamshire','Northamptonshire','Warwickshire','Wiltshire'],
  'Berkshire': ['Oxfordshire','Surrey','Hampshire','Buckinghamshire','Wiltshire','London'],
  'Hertfordshire': ['London','Essex','Bedfordshire','Buckinghamshire','Cambridgeshire'],
  'Cambridgeshire': ['Hertfordshire','Essex','Suffolk','Norfolk','Bedfordshire','Northamptonshire','Lincolnshire'],
  'Norfolk': ['Suffolk','Cambridgeshire','Lincolnshire'],
  'Suffolk': ['Norfolk','Essex','Cambridgeshire'],
  'West Midlands': ['Warwickshire','Staffordshire','Worcestershire'],
  'Greater Manchester': ['Lancashire','West Yorkshire','Derbyshire','Merseyside','South Yorkshire'],
  'West Yorkshire': ['Greater Manchester','South Yorkshire','North Yorkshire','Lancashire','Derbyshire'],
  'Merseyside': ['Lancashire','Greater Manchester'],
  'South Yorkshire': ['West Yorkshire','Greater Manchester','Derbyshire','Nottinghamshire','North Yorkshire','Lincolnshire'],
  'Lancashire': ['Greater Manchester','Merseyside','West Yorkshire','Cumbria','North Yorkshire'],
  'Nottinghamshire': ['South Yorkshire','Derbyshire','Leicestershire','Lincolnshire','Northamptonshire'],
  'Northamptonshire': ['Warwickshire','Oxfordshire','Buckinghamshire','Bedfordshire','Cambridgeshire','Leicestershire','Nottinghamshire'],
  'Warwickshire': ['West Midlands','Northamptonshire','Oxfordshire','Gloucestershire','Staffordshire','Leicestershire'],
  'Wiltshire': ['Somerset','Dorset','Hampshire','Berkshire','Oxfordshire','Gloucestershire'],
  'Cornwall': ['Devon'],
  'Derbyshire': ['Greater Manchester','South Yorkshire','West Yorkshire','Nottinghamshire','Leicestershire','Staffordshire'],
  'Durham': ['Tyne and Wear','Cleveland','North Yorkshire','Cumbria'],
  'Leicestershire': ['Nottinghamshire','Derbyshire','Warwickshire','Northamptonshire','Lincolnshire'],
  'Lincolnshire': ['Norfolk','Cambridgeshire','Nottinghamshire','South Yorkshire','Leicestershire','North Yorkshire','Humberside'],
  'North Yorkshire': ['West Yorkshire','South Yorkshire','Lancashire','Durham','Cleveland','Cumbria','Humberside','Lincolnshire'],
  'Humberside': ['North Yorkshire','Lincolnshire','South Yorkshire'],
  'Staffordshire': ['West Midlands','Derbyshire','Warwickshire'],
  'Tyne and Wear': ['Durham','Northumberland'],
  'Cleveland': ['Durham','North Yorkshire'],
  'Cumbria': ['Lancashire','Durham','North Yorkshire'],
  'Bedfordshire': ['Hertfordshire','Buckinghamshire','Cambridgeshire','Northamptonshire','London'],
  'Buckinghamshire': ['Oxfordshire','Berkshire','Hertfordshire','Bedfordshire','London','Northamptonshire'],
  'North Wales': ['South Wales','Gwent','Merseyside'],
  'South Wales': ['North Wales','Gwent','Dyfed-Powys'],
  'Gwent': ['South Wales','North Wales','Gloucestershire','Dyfed-Powys'],
  'Dyfed-Powys': ['South Wales','Gwent','North Wales']
};

function getCountyNeedScore(county) {
  const target = countyTargets[county] || 3;
  const current = countyCounts[county] || 0;
  return Math.max(0, target - current);
}

function selectCounties() {
  // Sort counties by how much more coverage they need
  const sorted = [...counties].sort((a, b) => getCountyNeedScore(b) - getCountyNeedScore(a));
  const primary = sorted[Math.floor(rand() * Math.min(5, sorted.length))];

  const numCounties = rand() < 0.45 ? 1 : (rand() < 0.7 ? 2 : 3);
  const result = [primary];

  if (numCounties > 1) {
    const possibleNeighbours = (neighbours[primary] || []).filter(n => counties.includes(n));
    if (possibleNeighbours.length > 0) {
      const second = possibleNeighbours[Math.floor(rand() * possibleNeighbours.length)];
      result.push(second);
      if (numCounties > 2 && possibleNeighbours.length > 1) {
        const remaining = possibleNeighbours.filter(n => n !== second);
        result.push(remaining[Math.floor(rand() * remaining.length)]);
      }
    }
  }

  result.forEach(c => countyCounts[c]++);
  return result;
}

function selectStations(repCounties) {
  const numStations = 2 + Math.floor(rand() * 5); // 2-6
  const allStations = [];
  repCounties.forEach(c => {
    const s = stationsByCounty[c];
    if (s) allStations.push(...s);
  });
  const shuffled = [...allStations].sort(() => rand() - 0.5);
  return shuffled.slice(0, Math.min(numStations, shuffled.length));
}

const bioTemplates = [
  (name, years, cties) => `${name.split(' ')[0]} has ${years} years of experience as a police station representative covering ${cties}. Committed to providing robust, professional representation for every client in custody.`,
  (name, years, cties) => `With ${years} years in criminal defence, ${name.split(' ')[0]} provides reliable police station representation across ${cties}. Known for thorough preparation and clear advice during police interviews.`,
  (name, years, cties) => `${name.split(' ')[0]} is an experienced police station representative serving ${cties}. With ${years} years of practice, they ensure every client receives clear legal guidance throughout the custody process.`,
  (name, years, cties) => `A dedicated representative with ${years} years of experience, ${name.split(' ')[0]} covers ${cties} and is available for urgent callouts. Recognised for a calm, professional approach in high-pressure situations.`,
  (name, years, cties) => `${name.split(' ')[0]} provides expert police station representation across ${cties}, drawing on ${years} years of criminal defence experience. Clients and solicitors alike value their meticulous attention to detail.`,
  (name, years, cties) => `Covering ${cties}, ${name.split(' ')[0]} brings ${years} years of specialist knowledge to police station attendance. They are known for ensuring clients' rights are fully protected during interviews.`,
  (name, years, cties) => `${name.split(' ')[0]} has been providing police station representation in ${cties} for ${years} years. A reliable and knowledgeable representative who is trusted by solicitors across the region.`,
  (name, years, cties) => `With ${years} years in practice, ${name.split(' ')[0]} is one of the most experienced representatives operating in ${cties}. They bring a thorough and empathetic approach to every case.`,
  (name, years, cties) => `${name.split(' ')[0]} offers responsive police station cover across ${cties}. Over ${years} years of practice, they have built a strong reputation for quality representation and client care.`,
  (name, years, cties) => `An accredited representative with ${years} years of experience, ${name.split(' ')[0]} covers ${cties} and provides round-the-clock callout availability for solicitors' firms.`,
];

function generateSlug(name) {
  return name.toLowerCase().replace(/'/g, '').replace(/\s+/g, '-');
}

const usedNames = new Set();
existingReps.forEach(r => usedNames.add(r.name));

function generateNewReps(startId, count) {
  const reps = [];
  let nameAttempts = 0;

  for (let i = 0; i < count; i++) {
    let fullName;
    do {
      fullName = pick(firstNames) + ' ' + pick(lastNames);
      nameAttempts++;
      if (nameAttempts > 10000) break;
    } while (usedNames.has(fullName));
    usedNames.add(fullName);

    const id = `r${startId + i}`;
    const slug = generateSlug(fullName);
    const repCounties = selectCounties();
    const stations = selectStations(repCounties);
    const availability = weightedPick(availabilityOptions);
    const accreditation = weightedPick(accreditationOptions);
    const phoneNum = String(startId + i).padStart(3, '0');
    const phone = `07700 9${phoneNum.slice(-5).padStart(5, '0')}`;
    const phoneFormatted = `07700 90${String(startId + i).padStart(4, '0').slice(-4)}`;
    const actualPhone = `07700 900${String(startId + i).padStart(3, '0')}`;

    const emailFirst = fullName.split(' ')[0][0].toLowerCase();
    const emailLast = fullName.split(' ').slice(-1)[0].toLowerCase().replace(/'/g, '');
    const email = `${emailFirst}${emailLast}@example.com`;

    const yearsExperience = 2 + Math.floor(rand() * 24);

    const languages = ['English'];
    if (rand() < 0.25) {
      const numExtra = 1 + Math.floor(rand() * 2);
      const extraLangs = pickN(additionalLanguages, numExtra, numExtra);
      languages.push(...extraLangs);
    }

    const repSpecialisms = pickN(specialisms, 2, 4);

    const countyStr = repCounties.length === 1
      ? repCounties[0]
      : repCounties.length === 2
        ? `${repCounties[0]} and ${repCounties[1]}`
        : `${repCounties.slice(0, -1).join(', ')}, and ${repCounties[repCounties.length - 1]}`;

    const bioFn = bioTemplates[Math.floor(rand() * bioTemplates.length)];
    const bio = bioFn(fullName, yearsExperience, countyStr);

    reps.push({
      id,
      name: fullName,
      slug,
      counties: repCounties,
      stations,
      availability,
      accreditation,
      phone: actualPhone,
      email,
      bio,
      yearsExperience,
      languages,
      specialisms: repSpecialisms
    });
  }

  return reps;
}

const newReps = generateNewReps(21, 180);
const allReps = [...existingReps, ...newReps];

const outputPath = path.join(__dirname, '..', 'data', 'reps.json');
fs.writeFileSync(outputPath, JSON.stringify(allReps, null, 2), 'utf8');

console.log(`Generated ${allReps.length} total reps (${existingReps.length} existing + ${newReps.length} new)`);
console.log(`Written to: ${outputPath}`);

// County coverage summary
const finalCounts = {};
counties.forEach(c => finalCounts[c] = 0);
allReps.forEach(rep => rep.counties.forEach(c => { if (finalCounts[c] !== undefined) finalCounts[c]++; }));
console.log('\nCounty coverage:');
Object.entries(finalCounts).sort((a, b) => b[1] - a[1]).forEach(([county, count]) => {
  console.log(`  ${county}: ${count}`);
});
