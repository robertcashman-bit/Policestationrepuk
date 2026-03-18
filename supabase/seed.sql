-- ============================================================
-- Police Station Rep UK — Seed Data
-- Run this after schema.sql to populate initial data
-- ============================================================

-- Counties
INSERT INTO counties (name, slug, description) VALUES
('Kent', 'kent', 'Kent is one of the busiest counties for police station representation in the South East of England. With major custody suites across Maidstone, Canterbury, Folkestone, Medway, and Tunbridge Wells, criminal solicitors regularly require outsourced police station representatives to provide 24/7 cover.'),
('London', 'london', 'London is the largest market for police station representation in the United Kingdom. The Metropolitan Police Service operates dozens of custody suites across all London boroughs, making reliable outsourced rep cover essential for every criminal law firm in the capital.'),
('Essex', 'essex', 'Essex has multiple busy custody suites including Southend, Chelmsford, Basildon, Colchester, and Grays. Criminal law firms across the county depend on accredited police station representatives for overnight and weekend cover.'),
('Surrey', 'surrey', 'Surrey''s custody suites at Guildford, Staines, and Reigate require regular police station representative cover. Solicitors in the county benefit from a network of experienced accredited representatives.'),
('Sussex', 'sussex', 'Sussex covers both East and West Sussex with custody suites in Brighton, Crawley, Hastings, Chichester, and Worthing. Police station representatives in Sussex handle a wide range of criminal matters.'),
('Hampshire', 'hampshire', 'Hampshire includes major custody suites in Southampton, Portsmouth, Basingstoke, and Winchester. The county has a strong demand for accredited police station representatives, particularly for out-of-hours cover.'),
('Hertfordshire', 'hertfordshire', 'Hertfordshire''s custody suites at Hatfield and Stevenage serve a large population. Criminal law firms across the county regularly use outsourced police station representatives for duty solicitor and own-client work.'),
('Greater Manchester', 'greater-manchester', 'Greater Manchester is one of the busiest areas for criminal law in the North of England. Multiple custody suites across Manchester, Salford, Bolton, and Stockport need reliable police station representative cover around the clock.'),
('West Midlands', 'west-midlands', 'The West Midlands region, centred on Birmingham, has extensive custody suite coverage. Police station representatives are in high demand for both duty solicitor rota work and private client instructions.'),
('West Yorkshire', 'west-yorkshire', 'West Yorkshire includes custody suites in Leeds, Bradford, Wakefield, and Huddersfield. The county has a consistently high volume of police station work requiring accredited representative cover.'),
('Merseyside', 'merseyside', 'Merseyside covers Liverpool and surrounding areas with busy custody suites. Police station representatives in the region handle high volumes of serious criminal matters.'),
('South Yorkshire', 'south-yorkshire', 'South Yorkshire includes Sheffield, Rotherham, Doncaster, and Barnsley custody suites. Accredited representatives provide vital cover for criminal law firms in the region.');

-- Stations (references counties by slug — use subqueries)
INSERT INTO stations (name, slug, county_id, address, postcode, latitude, longitude) VALUES
('Maidstone Police Station', 'maidstone', (SELECT id FROM counties WHERE slug = 'kent'), 'Palace Avenue, Maidstone, Kent', 'ME15 6NF', 51.2720, 0.5220),
('Canterbury Police Station', 'canterbury', (SELECT id FROM counties WHERE slug = 'kent'), 'Old Dover Road, Canterbury, Kent', 'CT1 3JQ', 51.2740, 1.0870),
('Folkestone Police Station', 'folkestone', (SELECT id FROM counties WHERE slug = 'kent'), 'Bouverie Road West, Folkestone, Kent', 'CT20 2RB', 51.0810, 1.1700),
('Medway Police Station', 'medway', (SELECT id FROM counties WHERE slug = 'kent'), 'Purser Way, Gillingham, Kent', 'ME7 1NE', 51.3850, 0.5490),
('Tunbridge Wells Police Station', 'tunbridge-wells', (SELECT id FROM counties WHERE slug = 'kent'), 'Crescent Road, Tunbridge Wells, Kent', 'TN1 2LU', 51.1340, 0.2640),
('Charing Cross Police Station', 'charing-cross', (SELECT id FROM counties WHERE slug = 'london'), 'Agar Street, London', 'WC2N 4JP', 51.5090, -0.1240),
('Brixton Police Station', 'brixton', (SELECT id FROM counties WHERE slug = 'london'), '367 Brixton Road, London', 'SW9 7DD', 51.4620, -0.1150),
('Lewisham Police Station', 'lewisham', (SELECT id FROM counties WHERE slug = 'london'), '43 Lewisham High Street, London', 'SE13 5JZ', 51.4540, -0.0130),
('Croydon Custody Centre', 'croydon', (SELECT id FROM counties WHERE slug = 'london'), '71 Park Lane, Croydon', 'CR9 1BP', 51.3760, -0.0990),
('Southend Police Station', 'southend', (SELECT id FROM counties WHERE slug = 'essex'), 'Victoria Avenue, Southend-on-Sea, Essex', 'SS2 6ES', 51.5410, 0.7120),
('Chelmsford Police Station', 'chelmsford', (SELECT id FROM counties WHERE slug = 'essex'), 'New Street, Chelmsford, Essex', 'CM1 1GD', 51.7340, 0.4730),
('Basildon Police Station', 'basildon', (SELECT id FROM counties WHERE slug = 'essex'), 'Great Oaks, Basildon, Essex', 'SS14 1EJ', 51.5760, 0.4590),
('Guildford Police Station', 'guildford', (SELECT id FROM counties WHERE slug = 'surrey'), 'Margaret Road, Guildford, Surrey', 'GU1 4QF', 51.2380, -0.5730),
('Staines Police Station', 'staines', (SELECT id FROM counties WHERE slug = 'surrey'), 'Kingston Road, Staines, Surrey', 'TW18 4LH', 51.4340, -0.5060),
('Brighton Custody Centre', 'brighton', (SELECT id FROM counties WHERE slug = 'sussex'), 'John Street, Brighton', 'BN2 0LA', 50.8280, -0.1360),
('Crawley Police Station', 'crawley', (SELECT id FROM counties WHERE slug = 'sussex'), 'Northgate Avenue, Crawley', 'RH10 8BF', 51.1120, -0.1870),
('Southampton Central', 'southampton', (SELECT id FROM counties WHERE slug = 'hampshire'), 'Southern Road, Southampton', 'SO15 1AN', 50.9060, -1.4070),
('Portsmouth Police Station', 'portsmouth', (SELECT id FROM counties WHERE slug = 'hampshire'), 'Winston Churchill Avenue, Portsmouth', 'PO1 2DP', 50.8000, -1.0860),
('Hatfield Police Station', 'hatfield', (SELECT id FROM counties WHERE slug = 'hertfordshire'), 'Comet Way, Hatfield, Hertfordshire', 'AL10 9SJ', 51.7640, -0.2260),
('Stevenage Police Station', 'stevenage', (SELECT id FROM counties WHERE slug = 'hertfordshire'), 'Lytton Way, Stevenage, Hertfordshire', 'SG1 1HF', 51.9020, -0.2000);

-- Representatives
INSERT INTO representatives (name, slug, bio, accreditation, availability, years_experience) VALUES
('Robert Cashman', 'robert-cashman', 'Robert Cashman is a highly experienced police station representative and criminal law solicitor with over 15 years of experience providing representation at police stations across Kent and London. He specialises in serious criminal matters including fraud, drug offences, and violent crime. Robert is known for his thorough preparation and client-focused approach.', 'Duty Solicitor & Accredited Representative', 'Available 24/7', 15),
('Sarah Mitchell', 'sarah-mitchell', 'Sarah Mitchell is an accredited police station representative covering Essex and London. With over 10 years in criminal defence, she provides reliable and professional cover at custody suites across both counties. Sarah has particular expertise in youth justice and domestic violence cases.', 'Accredited Representative', 'Available – Weekdays & Weekends', 10),
('James Thornton', 'james-thornton', 'James Thornton is an experienced police station representative working across Surrey, Sussex, and Hampshire. A former police officer turned legal representative, James brings unique insight to the custody process. He is available for both duty solicitor and private client work.', 'Duty Solicitor & Accredited Representative', 'Available 24/7', 12),
('Amanda Collins', 'amanda-collins', 'Amanda Collins provides police station representation across Hertfordshire and London. She is well-regarded for her calm, methodical approach and has extensive experience in cases involving vulnerable suspects. Amanda is available for regular and ad-hoc cover arrangements.', 'Accredited Representative', 'Available – Weekdays', 8),
('David Okonkwo', 'david-okonkwo', 'David Okonkwo is a highly regarded police station representative covering Greater Manchester and West Yorkshire. With over 20 years in criminal defence, he has represented thousands of clients at custody suites across the North of England. David specialises in serious and complex crime.', 'Duty Solicitor & Accredited Representative', 'Available 24/7', 20),
('Emma Richardson', 'emma-richardson', 'Emma Richardson is an accredited police station representative providing cover across Merseyside and Greater Manchester. She has particular expertise in fraud, cybercrime, and regulatory investigations. Emma is known for her detailed file notes and excellent client manner.', 'Accredited Representative', 'Available – Nights & Weekends', 7);

-- Junction: rep_counties
INSERT INTO rep_counties (rep_id, county_id) VALUES
((SELECT id FROM representatives WHERE slug = 'robert-cashman'), (SELECT id FROM counties WHERE slug = 'kent')),
((SELECT id FROM representatives WHERE slug = 'robert-cashman'), (SELECT id FROM counties WHERE slug = 'london')),
((SELECT id FROM representatives WHERE slug = 'sarah-mitchell'), (SELECT id FROM counties WHERE slug = 'essex')),
((SELECT id FROM representatives WHERE slug = 'sarah-mitchell'), (SELECT id FROM counties WHERE slug = 'london')),
((SELECT id FROM representatives WHERE slug = 'james-thornton'), (SELECT id FROM counties WHERE slug = 'surrey')),
((SELECT id FROM representatives WHERE slug = 'james-thornton'), (SELECT id FROM counties WHERE slug = 'sussex')),
((SELECT id FROM representatives WHERE slug = 'james-thornton'), (SELECT id FROM counties WHERE slug = 'hampshire')),
((SELECT id FROM representatives WHERE slug = 'amanda-collins'), (SELECT id FROM counties WHERE slug = 'hertfordshire')),
((SELECT id FROM representatives WHERE slug = 'amanda-collins'), (SELECT id FROM counties WHERE slug = 'london')),
((SELECT id FROM representatives WHERE slug = 'david-okonkwo'), (SELECT id FROM counties WHERE slug = 'greater-manchester')),
((SELECT id FROM representatives WHERE slug = 'david-okonkwo'), (SELECT id FROM counties WHERE slug = 'west-yorkshire')),
((SELECT id FROM representatives WHERE slug = 'emma-richardson'), (SELECT id FROM counties WHERE slug = 'merseyside')),
((SELECT id FROM representatives WHERE slug = 'emma-richardson'), (SELECT id FROM counties WHERE slug = 'greater-manchester'));

-- Junction: rep_stations
INSERT INTO rep_stations (rep_id, station_id) VALUES
((SELECT id FROM representatives WHERE slug = 'robert-cashman'), (SELECT id FROM stations WHERE slug = 'maidstone')),
((SELECT id FROM representatives WHERE slug = 'robert-cashman'), (SELECT id FROM stations WHERE slug = 'canterbury')),
((SELECT id FROM representatives WHERE slug = 'robert-cashman'), (SELECT id FROM stations WHERE slug = 'folkestone')),
((SELECT id FROM representatives WHERE slug = 'robert-cashman'), (SELECT id FROM stations WHERE slug = 'medway')),
((SELECT id FROM representatives WHERE slug = 'robert-cashman'), (SELECT id FROM stations WHERE slug = 'tunbridge-wells')),
((SELECT id FROM representatives WHERE slug = 'robert-cashman'), (SELECT id FROM stations WHERE slug = 'charing-cross')),
((SELECT id FROM representatives WHERE slug = 'robert-cashman'), (SELECT id FROM stations WHERE slug = 'brixton')),
((SELECT id FROM representatives WHERE slug = 'sarah-mitchell'), (SELECT id FROM stations WHERE slug = 'southend')),
((SELECT id FROM representatives WHERE slug = 'sarah-mitchell'), (SELECT id FROM stations WHERE slug = 'chelmsford')),
((SELECT id FROM representatives WHERE slug = 'sarah-mitchell'), (SELECT id FROM stations WHERE slug = 'basildon')),
((SELECT id FROM representatives WHERE slug = 'sarah-mitchell'), (SELECT id FROM stations WHERE slug = 'lewisham')),
((SELECT id FROM representatives WHERE slug = 'sarah-mitchell'), (SELECT id FROM stations WHERE slug = 'croydon')),
((SELECT id FROM representatives WHERE slug = 'james-thornton'), (SELECT id FROM stations WHERE slug = 'guildford')),
((SELECT id FROM representatives WHERE slug = 'james-thornton'), (SELECT id FROM stations WHERE slug = 'staines')),
((SELECT id FROM representatives WHERE slug = 'james-thornton'), (SELECT id FROM stations WHERE slug = 'brighton')),
((SELECT id FROM representatives WHERE slug = 'james-thornton'), (SELECT id FROM stations WHERE slug = 'crawley')),
((SELECT id FROM representatives WHERE slug = 'james-thornton'), (SELECT id FROM stations WHERE slug = 'southampton')),
((SELECT id FROM representatives WHERE slug = 'james-thornton'), (SELECT id FROM stations WHERE slug = 'portsmouth')),
((SELECT id FROM representatives WHERE slug = 'amanda-collins'), (SELECT id FROM stations WHERE slug = 'hatfield')),
((SELECT id FROM representatives WHERE slug = 'amanda-collins'), (SELECT id FROM stations WHERE slug = 'stevenage')),
((SELECT id FROM representatives WHERE slug = 'amanda-collins'), (SELECT id FROM stations WHERE slug = 'charing-cross')),
((SELECT id FROM representatives WHERE slug = 'amanda-collins'), (SELECT id FROM stations WHERE slug = 'croydon'));
